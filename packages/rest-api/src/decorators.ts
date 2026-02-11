import {
  DecoratorContext,
  getKeyName,
  getTypeName,
  isErrorType,
  isKey,
  Model,
  ModelProperty,
  Operation,
  Program,
  setTypeSpecNamespace,
  Type,
} from "@typespec/compiler";
import { $path, getOperationVerb, HttpVerb } from "@typespec/http";
import {
  unsafe_DefaultRouteProducer as DefaultRouteProducer,
  unsafe_getRouteProducer as getRouteProducer,
  unsafe_RouteOptions as RouteOptions,
  unsafe_RouteProducerResult as RouteProducerResult,
  unsafe_setRouteProducer as setRouteProducer,
} from "@typespec/http/experimental";
import type { DiagnosticResult } from "@typespec/compiler";
import type { HttpOperation } from "@typespec/http";
import type {
  ActionDecorator,
  CollectionActionDecorator,
  CopyResourceKeyParametersDecorator,
  CreatesDecorator,
  CreatesOrReplacesDecorator,
  DeletesDecorator,
  ListsDecorator,
  ParentResourceDecorator,
  ReadsDecorator,
  ResourceDecorator,
  UpdatesDecorator,
} from "../generated-defs/TypeSpec.RestApi.js";
import { reportDiagnostic, RestApiStateKeys } from "./lib.js";

// =============================================================================
// Resource key management
// =============================================================================

export interface ResourceKey {
  resourceType: Model;
  keyProperty: ModelProperty;
}

/**
 * Find the key property of a resource model type. Searches direct properties,
 * then base model properties. Results are cached for performance.
 */
export function getResourceTypeKey(program: Program, resourceType: Model): ResourceKey | undefined {
  let resourceKey: ResourceKey | undefined = program
    .stateMap(RestApiStateKeys.resource)
    .get(resourceType);
  if (resourceKey) {
    return resourceKey;
  }

  resourceType.properties.forEach((p: ModelProperty) => {
    if (isKey(program, p)) {
      if (resourceKey) {
        reportDiagnostic(program, {
          code: "duplicate-key",
          format: { resourceName: resourceType.name },
          target: p,
        });
      } else {
        resourceKey = { resourceType, keyProperty: p };
        program.stateMap(RestApiStateKeys.resource).set(resourceType, resourceKey);
      }
    }
  });

  if (resourceKey === undefined && resourceType.baseModel !== undefined) {
    resourceKey = getResourceTypeKey(program, resourceType.baseModel);
    if (resourceKey !== undefined) {
      program.stateMap(RestApiStateKeys.resource).set(resourceType, resourceKey);
    }
  }

  return resourceKey;
}

// =============================================================================
// @resource decorator
// =============================================================================

export const $resource: ResourceDecorator = (context, entity, collectionName) => {
  const key = getResourceTypeKey(context.program, entity);
  if (!key) {
    reportDiagnostic(context.program, {
      code: "resource-missing-key",
      format: { modelName: entity.name },
      target: entity,
    });
    return;
  }

  // Store the collection name as a segment on the key property
  context.program.stateMap(RestApiStateKeys.segments).set(key.keyProperty, collectionName);

  // Also store it directly so we can persist across cloning
  key.keyProperty.decorators.push({
    decorator: $setSegment,
    args: [
      { value: context.program.checker.createLiteralType(collectionName), jsValue: collectionName },
    ],
  });
};

// Internal helper to set segment
function $setSegment(context: DecoratorContext, entity: Model | ModelProperty | Operation, name: string) {
  context.program.stateMap(RestApiStateKeys.segments).set(entity, name);
}

setTypeSpecNamespace("Private", $setSegment);

function getSegment(program: Program, entity: Type): string | undefined {
  return program.stateMap(RestApiStateKeys.segments).get(entity);
}

function getResourceSegment(program: Program, resourceType: Model): string | undefined {
  const resourceKey = getResourceTypeKey(program, resourceType);
  return resourceKey
    ? getSegment(program, resourceKey.keyProperty)
    : getSegment(program, resourceType);
}

// =============================================================================
// @parentResource decorator
// =============================================================================

export function getParentResource(program: Program, resourceType: Model): Model | undefined {
  return program.stateMap(RestApiStateKeys.parentResource).get(resourceType);
}

export const $parentResource: ParentResourceDecorator = (context, entity, parentType) => {
  const { program } = context;

  // Check for circular references
  const visited = new Set<Model>();
  visited.add(entity);
  let current: Model | undefined = parentType;
  while (current) {
    if (visited.has(current)) {
      const cycle = [...visited, current].map((x) => getTypeName(x)).join(" -> ");
      reportDiagnostic(program, {
        code: "circular-parent-resource",
        format: { cycle },
        target: entity,
      });
      return;
    }
    visited.add(current);
    current = getParentResource(program, current);
  }

  program.stateMap(RestApiStateKeys.parentResource).set(entity, parentType);
};

// =============================================================================
// Resource operation decorators
// =============================================================================

export type ResourceOperationType =
  | "read"
  | "create"
  | "createOrReplace"
  | "update"
  | "delete"
  | "list";

export interface ResourceOperation {
  operation: ResourceOperationType;
  resourceType: Model;
}

const resourceOperationToVerb: Record<ResourceOperationType, HttpVerb> = {
  read: "get",
  create: "post",
  createOrReplace: "put",
  update: "patch",
  delete: "delete",
  list: "get",
};

function getResourceOperationHttpVerb(
  program: Program,
  operation: Operation,
): HttpVerb | undefined {
  const resourceOperation = getResourceOperation(program, operation);
  return (
    getOperationVerb(program, operation) ??
    (resourceOperation && resourceOperationToVerb[resourceOperation.operation]) ??
    (getActionDetails(program, operation) || getCollectionActionDetails(program, operation)
      ? "post"
      : undefined)
  );
}

function resourceRouteProducer(
  program: Program,
  operation: Operation,
  parentSegments: string[],
  overloadBase: HttpOperation | undefined,
  options: RouteOptions,
): DiagnosticResult<RouteProducerResult> {
  const paramOptions = {
    ...(options?.paramOptions ?? {}),
    verbSelector: getResourceOperationHttpVerb,
  };
  return DefaultRouteProducer(program, operation, parentSegments, overloadBase, {
    ...options,
    paramOptions,
  });
}

function setResourceOperation(
  context: DecoratorContext,
  entity: Operation,
  resourceType: Model,
  operation: ResourceOperationType,
) {
  if ((resourceType as any).kind === "TemplateParameter") {
    return;
  }

  context.program.stateMap(RestApiStateKeys.resourceOperations).set(entity, {
    operation,
    resourceType,
  });

  if (!getRouteProducer(context.program, entity)) {
    setRouteProducer(context.program, entity, resourceRouteProducer);
  }
}

/**
 * Get the resource operation metadata for an operation.
 */
export function getResourceOperation(
  program: Program,
  operation: Operation,
): ResourceOperation | undefined {
  return program.stateMap(RestApiStateKeys.resourceOperations).get(operation);
}

/**
 * Returns `true` if the given operation is a list operation.
 */
export function isListOperation(program: Program, target: Operation): boolean {
  return getResourceOperation(program, target)?.operation === "list";
}

// @reads
export const $reads: ReadsDecorator = (context, entity, resourceType) => {
  setResourceOperation(context, entity, resourceType, "read");
};

// @creates
export const $creates: CreatesDecorator = (context, entity, resourceType) => {
  const segment = getResourceSegment(context.program, resourceType);
  if (segment) {
    context.program.stateMap(RestApiStateKeys.segments).set(entity, segment);
  }
  setResourceOperation(context, entity, resourceType, "create");
};

// @createsOrReplaces
export const $createsOrReplaces: CreatesOrReplacesDecorator = (context, entity, resourceType) => {
  setResourceOperation(context, entity, resourceType, "createOrReplace");
};

// @updates
export const $updates: UpdatesDecorator = (context, entity, resourceType) => {
  setResourceOperation(context, entity, resourceType, "update");
};

// @deletes
export const $deletes: DeletesDecorator = (context, entity, resourceType) => {
  setResourceOperation(context, entity, resourceType, "delete");
};

// @lists
export const $lists: ListsDecorator = (context, entity, resourceType) => {
  const segment = getResourceSegment(context.program, resourceType);
  if (segment) {
    context.program.stateMap(RestApiStateKeys.segments).set(entity, segment);
  }
  setResourceOperation(context, entity, resourceType, "list");
};

// =============================================================================
// @action and @collectionAction decorators
// =============================================================================

export interface ActionDetails {
  /** The name of the action */
  name: string;
  /** Whether the name was explicitly specified or derived from the operation name */
  kind: "automatic" | "specified";
}

function lowerCaseFirstChar(str: string): string {
  return str[0].toLocaleLowerCase() + str.substring(1);
}

function makeActionName(op: Operation, name: string | undefined): ActionDetails {
  return {
    name: lowerCaseFirstChar(name || op.name),
    kind: name ? "specified" : "automatic",
  };
}

export const $action: ActionDecorator = (context, entity, name?) => {
  if (name === "") {
    reportDiagnostic(context.program, {
      code: "invalid-action-name",
      target: entity,
    });
    return;
  }

  const action = makeActionName(entity, name);
  context.program.stateMap(RestApiStateKeys.actionSegment).set(entity, action.name);
  context.program.stateMap(RestApiStateKeys.actions).set(entity, action);
};

/**
 * Gets the ActionDetails for an operation marked with @action.
 */
export function getActionDetails(
  program: Program,
  operation: Operation,
): ActionDetails | undefined {
  return program.stateMap(RestApiStateKeys.actions).get(operation);
}

export const $collectionAction: CollectionActionDecorator = (
  context,
  entity,
  resourceType,
  name?,
) => {
  if ((resourceType as Type).kind === "TemplateParameter") {
    return;
  }

  const segment = getResourceSegment(context.program, resourceType);
  if (segment) {
    context.program.stateMap(RestApiStateKeys.segments).set(entity, segment);
  }

  const action = makeActionName(entity, name);
  context.program.stateMap(RestApiStateKeys.actionSegment).set(entity, action.name);

  action.name = `${segment}/${action.name}`;
  context.program.stateMap(RestApiStateKeys.collectionActions).set(entity, action);
};

/**
 * Gets the ActionDetails for an operation marked with @collectionAction.
 */
export function getCollectionActionDetails(
  program: Program,
  operation: Operation,
): ActionDetails | undefined {
  return program.stateMap(RestApiStateKeys.collectionActions).get(operation);
}

// =============================================================================
// @copyResourceKeyParameters (internal decorator for templates)
// =============================================================================

const VISIBILITY_DECORATORS_NAMES = new Set(["$visibility", "$invisible", "$removeVisibility"]);

function cloneKeyProperties(context: DecoratorContext, target: Model, resourceType: Model) {
  const { program } = context;
  const parentType = getParentResource(program, resourceType);
  if (parentType) {
    cloneKeyProperties(context, target, parentType);
  }

  const resourceKey = getResourceTypeKey(program, resourceType);
  if (resourceKey) {
    const { keyProperty } = resourceKey;
    const keyName = getKeyName(program, keyProperty)!;

    const decorators = [
      ...keyProperty.decorators.filter(
        (d) => !VISIBILITY_DECORATORS_NAMES.has(d.decorator.name),
      ),
    ];

    if (!keyProperty.decorators.some((d) => d.decorator.name === $path.name)) {
      decorators.push({ decorator: $path, args: [] });
    }

    const newProp = program.checker.cloneType(keyProperty, {
      name: keyName,
      decorators,
      optional: false,
      model: target,
      sourceProperty: undefined,
    });

    target.properties.set(keyName, newProp);
  }
}

export const $copyResourceKeyParameters: CopyResourceKeyParametersDecorator = (
  context,
  entity,
  filter?,
) => {
  const reportNoKeyError = () =>
    reportDiagnostic(context.program, {
      code: "not-key-type",
      target: entity,
    });

  const templateArguments = entity.templateMapper?.args;
  if (!templateArguments || templateArguments.length !== 1) {
    return reportNoKeyError();
  }

  if ((templateArguments[0] as any).kind !== "Model") {
    if (isErrorType(templateArguments[0])) {
      return;
    }
    return reportNoKeyError();
  }

  const resourceType = templateArguments[0] as Model;

  if (filter === "parent") {
    const parentType = getParentResource(context.program, resourceType);
    if (parentType) {
      cloneKeyProperties(context, entity, parentType);
    }
  } else {
    cloneKeyProperties(context, entity, resourceType);
  }
};
