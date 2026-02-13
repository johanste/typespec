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

export async function emitHttpApiDocs(
  context: EmitContext<HttpApiDocsEmitterOptions>,
): Promise<void> {
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
    const outputFileName = context.options["output-file"] ?? `{service-name}.md`;

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

function generateServiceDoc(
  program: import("@typespec/compiler").Program,
  service: HttpService,
): string {
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

  // Collect all operations and identify common error responses
  const operationsByTag = groupOperations(program, service.operations);
  const allOperations = [...operationsByTag.values()].flat();
  const commonErrors = findCommonErrors(program, allOperations);

  for (const [group, operations] of operationsByTag) {
    if (group) {
      lines.push(`## ${group}`);
      lines.push("");
    }

    for (const httpOp of operations) {
      lines.push(...generateOperationDoc(program, httpOp, commonErrors));
    }
  }

  // Emit common errors section
  if (commonErrors.size > 0) {
    lines.push("## Common Errors");
    lines.push("");
    lines.push("The following error responses apply to all operations in this API.");
    lines.push("");

    for (const [, errorDoc] of commonErrors) {
      lines.push(...errorDoc.lines);
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

/** Fingerprint for an error response based on status code and body structure. */
function getResponseFingerprint(
  program: import("@typespec/compiler").Program,
  response: HttpOperationResponse,
): string {
  const statusCode = formatStatusCode(response.statusCodes);
  const bodyParts: string[] = [];
  for (const content of response.responses) {
    if (content.body && content.body.bodyKind === "single") {
      bodyParts.push(getTypeName(content.body.type));
      if (content.body.type.kind === "Model") {
        for (const [name, prop] of content.body.type.properties) {
          bodyParts.push(`${name}:${getTypeName(prop.type)}`);
        }
      }
    }
  }
  return `${statusCode}|${bodyParts.join(",")}`;
}

interface CommonErrorEntry {
  fingerprint: string;
  lines: string[];
}

/** Find error responses that appear in the majority of operations. */
function findCommonErrors(
  program: import("@typespec/compiler").Program,
  operations: HttpOperation[],
): Map<string, CommonErrorEntry> {
  if (operations.length <= 1) {
    return new Map();
  }

  // Count how many operations each error fingerprint appears in
  const errorCounts = new Map<string, number>();
  const errorResponses = new Map<string, HttpOperationResponse>();

  for (const op of operations) {
    const seen = new Set<string>();
    for (const response of op.responses) {
      if (!isErrorResponse(response)) continue;
      const fp = getResponseFingerprint(program, response);
      if (!seen.has(fp)) {
        seen.add(fp);
        errorCounts.set(fp, (errorCounts.get(fp) ?? 0) + 1);
        if (!errorResponses.has(fp)) {
          errorResponses.set(fp, response);
        }
      }
    }
  }

  // Consider an error "common" if it appears in more than half the operations
  const threshold = Math.ceil(operations.length / 2);
  const commonErrors = new Map<string, CommonErrorEntry>();

  for (const [fp, count] of errorCounts) {
    if (count >= threshold) {
      const response = errorResponses.get(fp)!;
      commonErrors.set(fp, {
        fingerprint: fp,
        lines: generateResponseDoc(program, response),
      });
    }
  }

  return commonErrors;
}

/** Check if a response is an error response (4xx, 5xx, or *). */
function isErrorResponse(response: HttpOperationResponse): boolean {
  const sc = response.statusCodes;
  if (sc === "*") return true;
  if (typeof sc === "number") return sc >= 400;
  return sc.start >= 400;
}

function generateOperationDoc(
  program: import("@typespec/compiler").Program,
  httpOp: HttpOperation,
  commonErrors: Map<string, CommonErrorEntry>,
): string[] {
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
      const description = buildDescription(paramDoc, param.param.type);
      lines.push(
        `| ${escapeForTable(param.param.name)} | ${location} | \`${escapeForTable(typeName)}\` | ${required} | ${escapeForTable(description)} |`,
      );
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
        const description = buildDescription(propDoc, prop.type);
        lines.push(
          `| ${escapeForTable(name)} | \`${escapeForTable(typeName)}\` | ${required} | ${escapeForTable(description)} |`,
        );
      }
      lines.push("");
    }
  }

  // Responses
  if (httpOp.responses.length > 0) {
    const uniqueResponses: HttpOperationResponse[] = [];
    const skippedCommon: string[] = [];

    for (const response of httpOp.responses) {
      const fp = getResponseFingerprint(program, response);
      if (isErrorResponse(response) && commonErrors.has(fp)) {
        skippedCommon.push(formatStatusCode(response.statusCodes));
      } else {
        uniqueResponses.push(response);
      }
    }

    if (uniqueResponses.length > 0 || skippedCommon.length > 0) {
      lines.push("#### Responses");
      lines.push("");

      for (const response of uniqueResponses) {
        lines.push(...generateResponseDoc(program, response));
      }

      if (skippedCommon.length > 0) {
        lines.push(
          `This operation also returns [common errors](#common-errors) (${skippedCommon.join(", ")}).`,
        );
        lines.push("");
      }
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
  const description = response.description ?? getStatusCodeDescription(statusCode) ?? "";

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
          const description = buildDescription(propDoc, prop.type);
          lines.push(
            `| ${escapeForTable(name)} | \`${escapeForTable(typeName)}\` | ${required} | ${escapeForTable(description)} |`,
          );
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

/** Escape content for use inside a markdown table cell.
 *  - Replaces newlines with `<br>` to keep the row on one line
 *  - Escapes pipe characters so they don't break column boundaries
 */
function escapeForTable(value: string): string {
  return value.replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|");
}

/** Return an extra description for types that lose information when shown as
 *  a plain JSON type name (e.g. Record types shown as `object`).
 */
function getTypeDescription(type: Type): string {
  if (type.kind === "Model" && type.indexer && type.indexer.key.name === "string") {
    const valueType = getTypeName(type.indexer.value);
    return `A map of string keys to ${valueType} values.`;
  }
  if (type.kind === "Union") {
    for (const [, variant] of type.variants) {
      const desc = getTypeDescription(variant.type);
      if (desc) return desc;
    }
  }
  return "";
}

/** Combine the doc string with any auto-generated type description. */
function buildDescription(doc: string, type: Type): string {
  const typeDesc = getTypeDescription(type);
  if (!typeDesc) return doc;
  return doc ? `${typeDesc} ${doc}` : typeDesc;
}

function getTypeName(type: Type): string {
  switch (type.kind) {
    case "Scalar":
      return type.name;
    case "Model":
      if (type.name === "Array" && type.indexer) {
        return `${getTypeName(type.indexer.value)}[]`;
      }
      return "object";
    case "Enum":
      return formatEnumName(type);
    case "Union":
      return formatUnionName(type);
    case "Intrinsic":
      return type.name;
    case "String":
      return `"${type.value}"`;
    case "Number":
      return type.value.toString();
    case "Boolean":
      return type.value.toString();
    case "EnumMember":
      if (type.value !== undefined) {
        return typeof type.value === "string" ? `"${type.value}"` : type.value.toString();
      }
      return `"${type.name}"`;
    case "StringTemplate":
      return type.stringValue !== undefined ? `"${type.stringValue}"` : "string";
    case "Tuple":
      return "[]";
    default:
      return "unknown";
  }
}

/** Max number of enum/union variants to inline before falling back to the name. */
const MAX_INLINE_VARIANTS = 10;

function formatEnumName(enumType: import("@typespec/compiler").Enum): string {
  if (enumType.members.size > MAX_INLINE_VARIANTS) {
    return enumType.name;
  }
  const members: string[] = [];
  for (const [, member] of enumType.members) {
    if (member.value !== undefined) {
      members.push(
        typeof member.value === "string" ? `"${member.value}"` : member.value.toString(),
      );
    } else {
      members.push(`"${member.name}"`);
    }
  }
  return members.join(" | ");
}

function formatUnionName(union: Union): string {
  if (union.variants.size > MAX_INLINE_VARIANTS && union.name) {
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
    case "String":
      return type.value;
    case "Number":
      return type.value;
    case "Boolean":
      return type.value;
    case "EnumMember":
      return type.value ?? type.name;
    case "StringTemplate":
      return type.stringValue ?? "string";
    case "Tuple": {
      const items: unknown[] = [];
      for (const value of type.values) {
        items.push(generateExampleJson(value, depth + 1));
      }
      return items;
    }
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
  // Return example for the first non-null variant.
  // Don't increment depth here — resolving a union variant is type
  // unwrapping, not structural nesting.
  for (const [, variant] of union.variants) {
    if (variant.type.kind !== "Intrinsic" || variant.type.name !== "null") {
      return generateExampleJson(variant.type, depth);
    }
  }
  return null;
}
