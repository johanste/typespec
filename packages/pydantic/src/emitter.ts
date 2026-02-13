import type { Namespace } from "@typespec/compiler";
import {
  emitFile,
  getDoc,
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMaxValueExclusive,
  getMinItems,
  getMinLength,
  getMinValue,
  getMinValueExclusive,
  getPattern,
  isArrayModelType,
  resolvePath,
  type Enum,
  type Model,
  type ModelProperty,
  type Program,
  type Scalar,
  type Type,
  type Union,
} from "@typespec/compiler";
import { getAllHttpServices, listHttpOperationsIn } from "@typespec/http";
import type { PydanticEmitterOptions } from "./lib.js";

/** Usage category for a model */
export type ModelUsage = "input" | "output" | "roundtrip";

interface EmitResult {
  /** Map from output file path to content */
  outputs: Map<string, string>;
}

/**
 * Categorize all models by their usage in HTTP operations.
 * Returns maps of model → usage for the given program.
 */
export function categorizeModels(
  program: Program,
): Map<Model | Enum | Union, Set<"input" | "output">> {
  const usage = new Map<Model | Enum | Union, Set<"input" | "output">>();

  function markUsage(type: Type, role: "input" | "output", visited: Set<Type>): void {
    if (visited.has(type)) return;
    visited.add(type);

    if (type.kind === "Model") {
      if (isIntrinsicModel(type)) return;
      if (!usage.has(type)) usage.set(type, new Set());
      usage.get(type)!.add(role);
      // Recursively mark property types
      for (const prop of type.properties.values()) {
        markUsage(prop.type, role, visited);
      }
      if (type.baseModel) {
        markUsage(type.baseModel, role, visited);
      }
      if (type.indexer) {
        markUsage(type.indexer.value, role, visited);
      }
    } else if (type.kind === "Enum") {
      if (isLibraryType(type)) return;
      if (!usage.has(type)) usage.set(type, new Set());
      usage.get(type)!.add(role);
    } else if (type.kind === "Union" && type.name) {
      if (isLibraryType(type)) return;
      if (!usage.has(type)) usage.set(type, new Set());
      usage.get(type)!.add(role);
      for (const variant of type.variants.values()) {
        markUsage(variant.type, role, visited);
      }
    } else if (type.kind === "Union") {
      for (const variant of type.variants.values()) {
        markUsage(variant.type, role, visited);
      }
    }
  }

  // Try services first, then fallback to iterating all namespaces
  const [services] = getAllHttpServices(program);
  let foundOps = false;
  for (const service of services) {
    for (const op of service.operations) {
      foundOps = true;
      processOp(op);
    }
  }

  // Also scan all user namespaces for operations not in services
  if (!foundOps) {
    const visitedNs = new Set<Namespace>();
    function scanNamespace(ns: Namespace): void {
      if (visitedNs.has(ns)) return;
      visitedNs.add(ns);
      if (isLibraryNamespace(ns)) return;
      const [ops] = listHttpOperationsIn(program, ns);
      for (const op of ops) {
        processOp(op);
      }
      for (const child of ns.namespaces.values()) {
        scanNamespace(child);
      }
    }
    for (const ns of program.getGlobalNamespaceType().namespaces.values()) {
      scanNamespace(ns);
    }
  }

  function processOp(op: import("@typespec/http").HttpOperation): void {
    // Input: request body
    if (op.parameters.body) {
      markUsage(op.parameters.body.type, "input", new Set());
    }
    // Input: parameter types that are models
    for (const param of op.parameters.parameters) {
      markUsage(param.param.type, "input", new Set());
    }
    // Output: response bodies
    for (const response of op.responses) {
      for (const content of response.responses) {
        if (content.body) {
          markUsage(content.body.type, "output", new Set());
        }
      }
    }
  }

  return usage;
}

function isIntrinsicModel(model: Model): boolean {
  // Skip built-in types like Array, Record, etc. that have no namespace or are from TypeSpec namespace
  if (!model.name) return true;
  return isLibraryType(model);
}

/**
 * Check if a type belongs to a standard library namespace (TypeSpec, TypeSpec.Http, etc.)
 */
function isLibraryType(type: Model | Enum | Union): boolean {
  const ns = type.namespace;
  if (!ns) return false;
  const nsName = getNamespaceName(ns);
  return nsName === "TypeSpec" || nsName.startsWith("TypeSpec.");
}

function getNamespaceName(ns: {
  name: string;
  namespace?: { name: string; namespace?: any };
}): string {
  if (ns.namespace && ns.namespace.name) {
    const parent = getNamespaceName(ns.namespace);
    return parent ? `${parent}.${ns.name}` : ns.name;
  }
  return ns.name;
}

function isLibraryNamespace(ns: Namespace): boolean {
  const nsName = getNamespaceName(ns);
  return nsName === "TypeSpec" || nsName.startsWith("TypeSpec.");
}

/**
 * Determine the usage category for a model.
 */
export function getModelUsage(
  usageMap: Map<Model | Enum | Union, Set<"input" | "output">>,
  type: Model | Enum | Union,
): ModelUsage {
  const roles = usageMap.get(type);
  if (!roles) return "roundtrip"; // default for uncategorized models
  if (roles.has("input") && roles.has("output")) return "roundtrip";
  if (roles.has("input")) return "input";
  return "output";
}

/**
 * Map a TypeSpec scalar to Python type string.
 */
export function scalarToPythonType(scalar: Scalar): string {
  let current: Scalar | undefined = scalar;
  while (current) {
    switch (current.name) {
      case "string":
      case "url":
      case "plainDate":
      case "plainTime":
        return "str";
      case "boolean":
        return "bool";
      case "int8":
      case "int16":
      case "int32":
      case "int64":
      case "uint8":
      case "uint16":
      case "uint32":
      case "uint64":
      case "integer":
      case "safeint":
        return "int";
      case "float32":
      case "float64":
      case "float":
      case "numeric":
      case "decimal":
      case "decimal128":
        return "float";
      case "bytes":
        return "bytes";
      case "utcDateTime":
      case "offsetDateTime":
        return "datetime";
      case "duration":
        return "timedelta";
    }
    current = current.baseScalar;
  }
  return "Any";
}

/**
 * Get the set of imports needed for the given Python types.
 */
function getImportsForTypes(types: Set<string>): string[] {
  const imports: string[] = [];
  if (types.has("datetime") || types.has("timedelta")) {
    const dtTypes: string[] = [];
    if (types.has("datetime")) dtTypes.push("datetime");
    if (types.has("timedelta")) dtTypes.push("timedelta");
    imports.push(`from datetime import ${dtTypes.join(", ")}`);
  }
  return imports;
}

/**
 * Convert a TypeSpec type reference to a Python type annotation string.
 * Returns [typeAnnotation, referencedModels] where referencedModels are model
 * names that need to be imported.
 */
export function typeToAnnotation(program: Program, type: Type, refModels: Set<string>): string {
  switch (type.kind) {
    case "Scalar":
      return scalarToPythonType(type);
    case "Model": {
      if (isArrayModelType(type)) {
        // Array<T> → List[T]
        const elementType = type.indexer!.value;
        const inner = typeToAnnotation(program, elementType, refModels);
        return `List[${inner}]`;
      }
      if (type.name === "Record") {
        // Record<T> → Dict[str, T]
        const valueType = type.indexer!.value;
        const inner = typeToAnnotation(program, valueType, refModels);
        return `Dict[str, ${inner}]`;
      }
      if (!type.name || isIntrinsicModel(type)) {
        return "Any";
      }
      refModels.add(type.name);
      return `"${type.name}"`;
    }
    case "Enum":
      if (type.name) refModels.add(type.name);
      return `"${type.name}"`;
    case "Union": {
      const variants: string[] = [];
      for (const v of type.variants.values()) {
        variants.push(typeToAnnotation(program, v.type, refModels));
      }
      if (variants.length === 0) return "Any";
      if (variants.length === 1) return variants[0];
      return `Union[${variants.join(", ")}]`;
    }
    case "Intrinsic":
      if (type.name === "null") return "None";
      return "Any";
    case "String":
      return "str";
    case "Number":
      return Number.isInteger(type.value) ? "int" : "float";
    case "Boolean":
      return "bool";
    default:
      return "Any";
  }
}

/**
 * Build the Field() arguments for constraints on a property.
 */
export function getFieldConstraints(program: Program, prop: ModelProperty): string[] {
  const args: string[] = [];
  const type = prop.type;
  const targets: (ModelProperty | Scalar | Model)[] = [prop];
  if (type.kind === "Scalar") targets.push(type);
  if (type.kind === "Model") targets.push(type);

  for (const target of targets) {
    const minLength = getMinLength(program, target);
    if (minLength !== undefined) args.push(`min_length=${minLength}`);

    const maxLength = getMaxLength(program, target);
    if (maxLength !== undefined) args.push(`max_length=${maxLength}`);

    const pattern = getPattern(program, target);
    if (pattern !== undefined) args.push(`pattern=${JSON.stringify(pattern)}`);

    const minVal = getMinValue(program, target);
    if (minVal !== undefined) args.push(`ge=${minVal}`);

    const maxVal = getMaxValue(program, target);
    if (maxVal !== undefined) args.push(`le=${maxVal}`);

    const minValEx = getMinValueExclusive(program, target);
    if (minValEx !== undefined) args.push(`gt=${minValEx}`);

    const maxValEx = getMaxValueExclusive(program, target);
    if (maxValEx !== undefined) args.push(`lt=${maxValEx}`);

    const minItems = getMinItems(program, target);
    if (minItems !== undefined) args.push(`min_length=${minItems}`);

    const maxItems = getMaxItems(program, target);
    if (maxItems !== undefined) args.push(`max_length=${maxItems}`);
  }

  // Deduplicate
  return [...new Set(args)];
}

/**
 * Get the default value string for Python.
 */
function getDefaultValue(prop: ModelProperty): string | undefined {
  if (prop.defaultValue === undefined) return undefined;
  const val = prop.defaultValue;
  switch (val.valueKind) {
    case "StringValue":
      return JSON.stringify(val.value);
    case "NumericValue":
      return val.value.toString();
    case "BooleanValue":
      return val.value ? "True" : "False";
    case "NullValue":
      return "None";
    case "EnumValue":
      return val.value.value !== undefined
        ? JSON.stringify(val.value.value)
        : JSON.stringify(val.value.name);
    default:
      return undefined;
  }
}

/**
 * Generate a Pydantic model class for a TypeSpec Model.
 */
export function emitModel(program: Program, model: Model): string {
  const lines: string[] = [];
  const doc = getDoc(program, model);
  const baseClass =
    model.baseModel && !isIntrinsicModel(model.baseModel) ? model.baseModel.name : "BaseModel";

  lines.push(`class ${model.name}(${baseClass}):`);
  if (doc) {
    lines.push(`    """${doc}"""`);
  }

  const props = [...model.properties.values()];
  if (props.length === 0 && !doc) {
    lines.push("    pass");
  } else if (props.length === 0) {
    lines.push("    pass");
  }

  for (const prop of props) {
    const refModels = new Set<string>();
    let annotation = typeToAnnotation(program, prop.type, refModels);
    const constraints = getFieldConstraints(program, prop);
    const defaultVal = getDefaultValue(prop);
    const propDoc = getDoc(program, prop);

    if (propDoc) {
      constraints.push(`description=${JSON.stringify(propDoc)}`);
    }

    if (prop.optional) {
      annotation = `Optional[${annotation}]`;
    }

    let line: string;
    if (constraints.length > 0) {
      if (defaultVal !== undefined) {
        constraints.unshift(`default=${defaultVal}`);
      } else if (prop.optional) {
        constraints.unshift("default=None");
      }
      line = `    ${prop.name}: ${annotation} = Field(${constraints.join(", ")})`;
    } else if (defaultVal !== undefined) {
      line = `    ${prop.name}: ${annotation} = ${defaultVal}`;
    } else if (prop.optional) {
      line = `    ${prop.name}: ${annotation} = None`;
    } else {
      line = `    ${prop.name}: ${annotation}`;
    }
    lines.push(line);
  }

  return lines.join("\n");
}

/**
 * Generate a Python Enum class for a TypeSpec Enum.
 */
export function emitEnum(program: Program, enumType: Enum): string {
  const lines: string[] = [];
  const doc = getDoc(program, enumType);
  const members = [...enumType.members.values()];

  // Determine if all values are strings or ints
  const allString = members.every((m) => m.value === undefined || typeof m.value === "string");
  const allInt = members.every((m) => m.value !== undefined && typeof m.value === "number");
  const baseClass = allInt ? "IntEnum" : allString ? "StrEnum" : "Enum";

  lines.push(`class ${enumType.name}(${baseClass}):`);
  if (doc) {
    lines.push(`    """${doc}"""`);
  }

  for (const member of members) {
    const val = member.value !== undefined ? member.value : member.name;
    const pyVal = typeof val === "string" ? JSON.stringify(val) : String(val);
    lines.push(`    ${member.name} = ${pyVal}`);
  }

  if (members.length === 0) {
    lines.push("    pass");
  }

  return lines.join("\n");
}

/**
 * Generate a type alias or Union for a TypeSpec Union.
 */
export function emitUnion(program: Program, union: Union): string {
  const lines: string[] = [];
  const doc = getDoc(program, union);
  const refModels = new Set<string>();
  const variants: string[] = [];
  for (const v of union.variants.values()) {
    variants.push(typeToAnnotation(program, v.type, refModels));
  }

  const unionType = variants.length > 0 ? `Union[${variants.join(", ")}]` : "Any";

  lines.push(`${union.name} = ${unionType}`);
  if (doc) {
    lines.push(`"""${doc}"""`);
  }

  return lines.join("\n");
}

/**
 * Collect all models, enums, and named unions from a program.
 */
export function collectAllTypes(program: Program): {
  models: Model[];
  enums: Enum[];
  unions: Union[];
} {
  const models: Model[] = [];
  const enums: Enum[] = [];
  const unions: Union[] = [];
  const visited = new Set<Type>();

  function visit(ns: any): void {
    if (!ns) return;
    if (ns.models) {
      for (const model of ns.models.values()) {
        if (!visited.has(model) && !isIntrinsicModel(model) && model.name) {
          visited.add(model);
          models.push(model);
        }
      }
    }
    if (ns.enums) {
      for (const e of ns.enums.values()) {
        if (!visited.has(e) && !isLibraryType(e)) {
          visited.add(e);
          enums.push(e);
        }
      }
    }
    if (ns.unions) {
      for (const u of ns.unions.values()) {
        if (!visited.has(u) && u.name && !isLibraryType(u)) {
          visited.add(u);
          unions.push(u);
        }
      }
    }
    if (ns.namespaces) {
      for (const child of ns.namespaces.values()) {
        visit(child);
      }
    }
  }

  // Visit all namespaces in the program
  for (const ns of program.getGlobalNamespaceType().namespaces.values()) {
    visit(ns);
  }

  return { models, enums, unions };
}

/**
 * Generate a Python module with the given types.
 */
export function generateModule(program: Program, types: (Model | Enum | Union)[]): string {
  const sections: string[] = [];
  const needsField = types.some(
    (t) =>
      t.kind === "Model" &&
      [...t.properties.values()].some(
        (p) => getFieldConstraints(program, p).length > 0 || getDoc(program, p) !== undefined,
      ),
  );
  const needsOptional = types.some(
    (t) => t.kind === "Model" && [...t.properties.values()].some((p) => p.optional),
  );
  const needsUnionImport =
    types.some((t) => t.kind === "Union") ||
    types.some(
      (t) =>
        t.kind === "Model" &&
        [...t.properties.values()].some((p) => {
          return p.type.kind === "Union";
        }),
    );
  const needsList = types.some(
    (t) =>
      t.kind === "Model" &&
      [...t.properties.values()].some((p) => p.type.kind === "Model" && isArrayModelType(p.type)),
  );
  const needsDict = types.some(
    (t) =>
      t.kind === "Model" &&
      [...t.properties.values()].some((p) => p.type.kind === "Model" && p.type.name === "Record"),
  );
  const needsAny = types.some(
    (t) =>
      t.kind === "Model" &&
      [...t.properties.values()].some((p) => {
        const refModels = new Set<string>();
        return typeToAnnotation(program, p.type, refModels) === "Any";
      }),
  );

  const pythonTypes = new Set<string>();
  for (const t of types) {
    if (t.kind === "Model") {
      for (const p of t.properties.values()) {
        const refModels = new Set<string>();
        const ann = typeToAnnotation(program, p.type, refModels);
        if (ann === "datetime" || ann.includes("datetime")) pythonTypes.add("datetime");
        if (ann === "timedelta" || ann.includes("timedelta")) pythonTypes.add("timedelta");
      }
    }
  }

  // Standard library imports
  const stdImports = getImportsForTypes(pythonTypes);

  // Typing imports
  const typingImports: string[] = [];
  if (needsOptional) typingImports.push("Optional");
  if (needsUnionImport) typingImports.push("Union");
  if (needsList) typingImports.push("List");
  if (needsDict) typingImports.push("Dict");
  if (needsAny) typingImports.push("Any");
  if (typingImports.length > 0) {
    sections.push(`from typing import ${typingImports.join(", ")}`);
  }

  // Enum imports
  const hasEnum = types.some((t) => t.kind === "Enum");
  if (hasEnum) {
    const enumBases = new Set<string>();
    for (const t of types) {
      if (t.kind === "Enum") {
        const members = [...t.members.values()];
        const allInt = members.every((m) => m.value !== undefined && typeof m.value === "number");
        const allString = members.every(
          (m) => m.value === undefined || typeof m.value === "string",
        );
        if (allInt) enumBases.add("IntEnum");
        else if (allString) enumBases.add("StrEnum");
        else enumBases.add("Enum");
      }
    }
    sections.push(`from enum import ${[...enumBases].join(", ")}`);
  }

  // Standard library imports
  for (const imp of stdImports) {
    sections.push(imp);
  }

  // Pydantic imports
  const pydanticImports: string[] = ["BaseModel"];
  if (needsField) pydanticImports.push("Field");
  const hasModelType = types.some((t) => t.kind === "Model");
  if (hasModelType) {
    sections.push(`from pydantic import ${pydanticImports.join(", ")}`);
  } else if (needsField) {
    sections.push(`from pydantic import ${pydanticImports.join(", ")}`);
  }

  sections.push(""); // blank line after imports

  // Emit enums first (they may be referenced by models)
  for (const t of types) {
    if (t.kind === "Enum") {
      sections.push("");
      sections.push(emitEnum(program, t));
    }
  }

  // Emit unions
  for (const t of types) {
    if (t.kind === "Union") {
      sections.push("");
      sections.push(emitUnion(program, t));
    }
  }

  // Emit models (order: base classes first)
  const modelOrder = orderModels(types.filter((t) => t.kind === "Model") as Model[]);
  for (const model of modelOrder) {
    sections.push("");
    sections.push(emitModel(program, model));
  }

  return sections.join("\n") + "\n";
}

/**
 * Sort models so base classes appear before derived classes.
 */
function orderModels(models: Model[]): Model[] {
  const modelSet = new Set(models);
  const ordered: Model[] = [];
  const visited = new Set<Model>();

  function visit(model: Model): void {
    if (visited.has(model)) return;
    visited.add(model);
    if (model.baseModel && modelSet.has(model.baseModel)) {
      visit(model.baseModel);
    }
    ordered.push(model);
  }

  for (const m of models) {
    visit(m);
  }

  return ordered;
}

/**
 * Main emit function.
 */
export async function emitPydantic(
  program: Program,
  emitterOutputDir: string,
  options: PydanticEmitterOptions,
): Promise<EmitResult> {
  const inputModuleName = options["input-module-name"] ?? "input_types";
  const outputModuleName = options["output-module-name"] ?? "output_types";
  const roundtripModuleName = options["roundtrip-module-name"] ?? "roundtrip_types";
  const constrainToUsed = options["constrain-to-used"] ?? false;

  // Categorize models by usage
  const usageMap = categorizeModels(program);

  // Collect all types
  const { models, enums, unions } = collectAllTypes(program);
  const allTypes: (Model | Enum | Union)[] = [...models, ...enums, ...unions];

  // Group types by usage
  const inputTypes: (Model | Enum | Union)[] = [];
  const outputTypes: (Model | Enum | Union)[] = [];
  const roundtripTypes: (Model | Enum | Union)[] = [];

  for (const t of allTypes) {
    const usage = getModelUsage(usageMap, t);
    if (constrainToUsed && !usageMap.has(t)) {
      continue; // Skip types not used in any operation
    }
    switch (usage) {
      case "input":
        inputTypes.push(t);
        break;
      case "output":
        outputTypes.push(t);
        break;
      case "roundtrip":
        roundtripTypes.push(t);
        break;
    }
  }

  const outputs = new Map<string, string>();

  // Generate modules
  if (inputTypes.length > 0) {
    const content = generateModule(program, inputTypes);
    const path = resolvePath(emitterOutputDir, `${inputModuleName}.py`);
    await emitFile(program, { path, content });
    outputs.set(`${inputModuleName}.py`, content);
  }

  if (outputTypes.length > 0) {
    const content = generateModule(program, outputTypes);
    const path = resolvePath(emitterOutputDir, `${outputModuleName}.py`);
    await emitFile(program, { path, content });
    outputs.set(`${outputModuleName}.py`, content);
  }

  if (roundtripTypes.length > 0) {
    const content = generateModule(program, roundtripTypes);
    const path = resolvePath(emitterOutputDir, `${roundtripModuleName}.py`);
    await emitFile(program, { path, content });
    outputs.set(`${roundtripModuleName}.py`, content);
  }

  return { outputs };
}
