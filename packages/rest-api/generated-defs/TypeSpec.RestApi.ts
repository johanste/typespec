import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  Model,
  Operation,
} from "@typespec/compiler";

/**
 * Mark a model as a REST resource. A resource represents an entity that can be
 * identified by a unique key and managed through standard CRUD operations.
 *
 * @param collectionName The URL path segment used for the resource collection (e.g., "users", "orders").
 */
export type ResourceDecorator = (
  context: DecoratorContext,
  target: Model,
  collectionName: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Establish a parent-child relationship between resources, creating nested URL paths.
 * For example, marking `Comment` with `@parentResource(Post)` produces paths like
 * `/posts/{postId}/comments/{commentId}`.
 *
 * @param parent The parent resource model type.
 */
export type ParentResourceDecorator = (
  context: DecoratorContext,
  target: Model,
  parent: Model,
) => DecoratorValidatorCallbacks | void;

/**
 * Mark an operation as reading a single resource instance (HTTP GET on a resource).
 * The operation will be mapped to `GET /<collection>/{id}`.
 *
 * @param resourceType The resource model type this operation reads.
 */
export type ReadsDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => DecoratorValidatorCallbacks | void;

/**
 * Mark an operation as creating a new resource in a collection (HTTP POST).
 * The operation will be mapped to `POST /<collection>`.
 *
 * @param resourceType The resource model type this operation creates.
 */
export type CreatesDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => DecoratorValidatorCallbacks | void;

/**
 * Mark an operation as creating or replacing a resource (HTTP PUT).
 * The operation will be mapped to `PUT /<collection>/{id}`.
 *
 * @param resourceType The resource model type this operation creates or replaces.
 */
export type CreatesOrReplacesDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => DecoratorValidatorCallbacks | void;

/**
 * Mark an operation as updating a resource (HTTP PATCH).
 * The operation will be mapped to `PATCH /<collection>/{id}`.
 *
 * @param resourceType The resource model type this operation updates.
 */
export type UpdatesDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => DecoratorValidatorCallbacks | void;

/**
 * Mark an operation as deleting a resource (HTTP DELETE).
 * The operation will be mapped to `DELETE /<collection>/{id}`.
 *
 * @param resourceType The resource model type this operation deletes.
 */
export type DeletesDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => DecoratorValidatorCallbacks | void;

/**
 * Mark an operation as listing resources from a collection (HTTP GET on a collection).
 * The operation will be mapped to `GET /<collection>`.
 *
 * @param resourceType The resource model type this operation lists.
 */
export type ListsDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => DecoratorValidatorCallbacks | void;

/**
 * Define a custom action on a resource instance.
 * Creates an endpoint like `POST /<collection>/{id}/<actionName>`.
 *
 * @param name The URL path segment for the action. If not provided, the operation name is used.
 */
export type ActionDecorator = (
  context: DecoratorContext,
  target: Operation,
  name?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Define a custom action on a resource collection.
 * Creates an endpoint like `POST /<collection>/<actionName>`.
 *
 * @param resourceType The resource model type this action operates on.
 * @param name The URL path segment for the action. If not provided, the operation name is used.
 */
export type CollectionActionDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
  name?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Copy the resource key parameters onto a model.
 * Used internally by `KeysOf` and `ParentKeysOf` templates.
 *
 * @param filter If "parent", only copies parent resource keys.
 */
export type CopyResourceKeyParametersDecorator = (
  context: DecoratorContext,
  target: Model,
  filter?: string,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecRestApiDecorators = {
  resource: ResourceDecorator;
  parentResource: ParentResourceDecorator;
  reads: ReadsDecorator;
  creates: CreatesDecorator;
  createsOrReplaces: CreatesOrReplacesDecorator;
  updates: UpdatesDecorator;
  deletes: DeletesDecorator;
  lists: ListsDecorator;
  action: ActionDecorator;
  collectionAction: CollectionActionDecorator;
  copyResourceKeyParameters: CopyResourceKeyParametersDecorator;
};
