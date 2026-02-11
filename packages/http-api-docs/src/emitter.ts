import {
  type EmitContext,
  type Model,
  type Scalar,
  type Type,
  type Union,
  emitFile,
  getDoc,
  getNamespaceFullName,
  getService,
  getSummary,
  interpolatePath,
  resolvePath,
} from "@typespec/compiler";
import {
  type HttpOperation,
  type HttpOperationResponse,
  type HttpService,
  getAllHttpServices,
  getServers,
  getStatusCodeDescription,
} from "@typespec/http";

import type { HttpApiDocsEmitterOptions } from "./lib.js";

export async function emitHttpApiDocs(context: EmitContext<HttpApiDocsEmitterOptions>): Promise<void> {
  const program = context.program;
  const [httpServices, diagnostics] = getAllHttpServices(program);

  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }

  if (program.hasError()) {
    return;
  }

  const multipleServices = httpServices.length > 1;

  for (const httpService of httpServices) {
    const markdown = generateServiceDoc(program, httpService);
    const outputFileName =
      context.options["output-file"] ?? `{service-name}.md`;

    const resolvedFileName = interpolatePath(outputFileName, {
      "service-name": getNamespaceFullName(httpService.namespace),
      "service-name-if-multiple": multipleServices
        ? getNamespaceFullName(httpService.namespace)
        : undefined,
    });

    await emitFile(program, {
      path: resolvePath(context.emitterOutputDir, resolvedFileName),
      content: markdown,
      newLine: "lf",
    });
  }
}

function generateServiceDoc(program: import("@typespec/compiler").Program, service: HttpService): string {
  const lines: string[] = [];
  const serviceInfo = getService(program, service.namespace);
  const serviceName = serviceInfo?.title ?? service.namespace.name ?? "API";
  const serviceDoc = getDoc(program, service.namespace);

  lines.push(`# ${serviceName} API Reference`);
  lines.push("");

  if (serviceDoc) {
    lines.push(serviceDoc);
    lines.push("");
  }

  // Emit server info
  const servers = getServers(program, service.namespace);
  if (servers && servers.length > 0) {
    lines.push("## Server");
    lines.push("");
    for (const server of servers) {
      lines.push(`- \`${server.url}\`${server.description ? ` - ${server.description}` : ""}`);
    }
    lines.push("");
  }

  // Group operations by path
  const operationsByTag = groupOperations(program, service.operations);

  for (const [group, operations] of operationsByTag) {
    if (group) {
      lines.push(`## ${group}`);
      lines.push("");
    }

    for (const httpOp of operations) {
      lines.push(...generateOperationDoc(program, httpOp));
    }
  }

  return lines.join("\n");
}

function groupOperations(
  program: import("@typespec/compiler").Program,
  operations: HttpOperation[],
): Map<string, HttpOperation[]> {
  const groups = new Map<string, HttpOperation[]>();

  for (const op of operations) {
    // Group by interface/container name
    const groupName = op.container.kind === "Interface" ? op.container.name : "";
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push(op);
  }

  return groups;
}

function generateOperationDoc(program: import("@typespec/compiler").Program, httpOp: HttpOperation): string[] {
  const lines: string[] = [];
  const verb = httpOp.verb.toUpperCase();
  const path = httpOp.path;
  const opName = httpOp.operation.name;
  const summary = getSummary(program, httpOp.operation);
  const doc = getDoc(program, httpOp.operation);

  lines.push(`### ${summary ?? opName}`);
  lines.push("");
  lines.push(`\`${verb} ${path}\``);
  lines.push("");

  if (doc) {
    lines.push(doc);
    lines.push("");
  }

  // Parameters
  const params = httpOp.parameters.parameters;
  if (params.length > 0) {
    lines.push("#### Parameters");
    lines.push("");
    lines.push("| Name | In | Type | Required | Description |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const param of params) {
      const paramDoc = getDoc(program, param.param) ?? "";
      const location = param.type;
      const typeName = getTypeName(param.param.type);
      const required = !param.param.optional ? "Yes" : "No";
      lines.push(`| ${param.param.name} | ${location} | \`${typeName}\` | ${required} | ${paramDoc} |`);
    }
    lines.push("");
  }

  // Request body
  const body = httpOp.parameters.body;
  if (body && body.bodyKind === "single" && body.type.kind !== "Intrinsic") {
    lines.push("#### Request Body");
    lines.push("");
    const contentTypes = body.contentTypes;
    if (contentTypes.length > 0) {
      lines.push(`Content-Type: ${contentTypes.join(", ")}`);
      lines.push("");
    }

    if (isJsonContentType(contentTypes)) {
      const example = generateExampleJson(body.type, 0);
      lines.push("```json");
      lines.push(JSON.stringify(example, null, 2));
      lines.push("```");
      lines.push("");
    }

    // Body properties table
    if (body.type.kind === "Model" && body.type.properties.size > 0) {
      lines.push("| Property | Type | Required | Description |");
      lines.push("| --- | --- | --- | --- |");
      for (const [name, prop] of body.type.properties) {
        const propDoc = getDoc(program, prop) ?? "";
        const typeName = getTypeName(prop.type);
        const required = !prop.optional ? "Yes" : "No";
        lines.push(`| ${name} | \`${typeName}\` | ${required} | ${propDoc} |`);
      }
      lines.push("");
    }
  }

  // Responses
  if (httpOp.responses.length > 0) {
    lines.push("#### Responses");
    lines.push("");

    for (const response of httpOp.responses) {
      lines.push(...generateResponseDoc(program, response));
    }
  }

  lines.push("---");
  lines.push("");

  return lines;
}

function generateResponseDoc(
  program: import("@typespec/compiler").Program,
  response: HttpOperationResponse,
): string[] {
  const lines: string[] = [];
  const statusCode = formatStatusCode(response.statusCodes);
  const description =
    response.description ?? getStatusCodeDescription(statusCode) ?? "";

  lines.push(`##### ${statusCode}${description ? ` ${description}` : ""}`);
  lines.push("");

  for (const content of response.responses) {
    if (content.body && content.body.bodyKind === "single") {
      const contentTypes = content.body.contentTypes;
      if (contentTypes.length > 0) {
        lines.push(`Content-Type: ${contentTypes.join(", ")}`);
        lines.push("");
      }

      if (isJsonContentType(contentTypes)) {
        const example = generateExampleJson(content.body.type, 0);
        lines.push("```json");
        lines.push(JSON.stringify(example, null, 2));
        lines.push("```");
        lines.push("");
      }

      // Body properties table
      if (content.body.type.kind === "Model" && content.body.type.properties.size > 0) {
        lines.push("| Property | Type | Required | Description |");
        lines.push("| --- | --- | --- | --- |");
        for (const [name, prop] of content.body.type.properties) {
          const propDoc = getDoc(program, prop) ?? "";
          const typeName = getTypeName(prop.type);
          const required = !prop.optional ? "Yes" : "No";
          lines.push(`| ${name} | \`${typeName}\` | ${required} | ${propDoc} |`);
        }
        lines.push("");
      }
    }
  }

  return lines;
}

function formatStatusCode(statusCodes: HttpOperationResponse["statusCodes"]): string {
  if (typeof statusCodes === "number") {
    return statusCodes.toString();
  }
  if (statusCodes === "*") {
    return "*";
  }
  return `${statusCodes.start}-${statusCodes.end}`;
}

function isJsonContentType(contentTypes: readonly string[]): boolean {
  return (
    contentTypes.length === 0 ||
    contentTypes.some((ct) => ct === "application/json" || ct.endsWith("+json"))
  );
}

function getTypeName(type: Type): string {
  switch (type.kind) {
    case "Scalar":
      return type.name;
    case "Model":
      if (type.name === "Array" && type.indexer) {
        return `${getTypeName(type.indexer.value)}[]`;
      }
      return type.name || "object";
    case "Enum":
      return type.name;
    case "Union":
      return formatUnionName(type);
    case "Intrinsic":
      return type.name;
    default:
      return "unknown";
  }
}

function formatUnionName(union: Union): string {
  if (union.name) {
    return union.name;
  }
  const variants: string[] = [];
  for (const [, variant] of union.variants) {
    variants.push(getTypeName(variant.type));
  }
  return variants.join(" | ");
}

/**
 * Generate example JSON from a TypeSpec type. This creates synthetic
 * placeholder values when no explicit @example is provided.
 */
export function generateExampleJson(type: Type, depth: number): unknown {
  // Prevent infinite recursion for circular references
  if (depth > 5) {
    return {};
  }

  switch (type.kind) {
    case "Model":
      return generateModelExample(type, depth);
    case "Scalar":
      return generateScalarExample(type);
    case "Enum":
      return generateEnumExample(type);
    case "Union":
      return generateUnionExample(type, depth);
    case "Intrinsic":
      if (type.name === "void" || type.name === "never") {
        return undefined;
      }
      if (type.name === "null") {
        return null;
      }
      return {};
    default:
      return {};
  }
}

function generateModelExample(model: Model, depth: number): unknown {
  // Handle array types
  if (model.name === "Array" && model.indexer) {
    const itemExample = generateExampleJson(model.indexer.value, depth + 1);
    return [itemExample];
  }

  // Handle Record types
  if (model.indexer && model.indexer.key.name === "string") {
    const valueExample = generateExampleJson(model.indexer.value, depth + 1);
    return { key: valueExample };
  }

  const result: Record<string, unknown> = {};
  for (const [name, prop] of model.properties) {
    const value = generateExampleJson(prop.type, depth + 1);
    if (value !== undefined) {
      result[name] = value;
    }
  }
  return result;
}

function generateScalarExample(scalar: Scalar): unknown {
  const name = getBaseScalarName(scalar);
  switch (name) {
    case "string":
      return "string";
    case "boolean":
      return false;
    case "int8":
    case "int16":
    case "int32":
    case "int64":
    case "uint8":
    case "uint16":
    case "uint32":
    case "uint64":
    case "safeint":
    case "integer":
    case "numeric":
      return 0;
    case "float":
    case "float16":
    case "float32":
    case "float64":
    case "decimal":
    case "decimal128":
      return 0.0;
    case "plainDate":
      return "2024-01-01";
    case "plainTime":
      return "12:00:00";
    case "utcDateTime":
    case "offsetDateTime":
      return "2024-01-01T00:00:00Z";
    case "duration":
      return "PT1H";
    case "bytes":
      return "base64EncodedString";
    case "url":
      return "https://example.com";
    default:
      return "string";
  }
}

function getBaseScalarName(scalar: Scalar): string {
  let current: Scalar | undefined = scalar;
  while (current) {
    if (!current.baseScalar) {
      return current.name;
    }
    current = current.baseScalar;
  }
  return scalar.name;
}

function generateEnumExample(enumType: import("@typespec/compiler").Enum): unknown {
  const firstMember = enumType.members.values().next();
  if (firstMember.done) {
    return "string";
  }
  return firstMember.value.value ?? firstMember.value.name;
}

function generateUnionExample(union: Union, depth: number): unknown {
  // Return example for the first non-null variant
  for (const [, variant] of union.variants) {
    if (variant.type.kind !== "Intrinsic" || variant.type.name !== "null") {
      return generateExampleJson(variant.type, depth + 1);
    }
  }
  return null;
}
