using TypeSpec.Http;
using TypeSpec.Reflection;

namespace TypeSpec.RestApi;

/**
 * Mark a model as a REST resource. A resource represents an entity that can be
 * identified by a unique key and managed through standard CRUD operations.
 *
 * @param collectionName The URL path segment used for the resource collection (e.g., "users", "orders").
 */
extern dec resource(target: Model, collectionName: valueof string);

/**
 * Establish a parent-child relationship between resources, creating nested URL paths.
 * For example, marking `Comment` with `@parentResource(Post)` produces paths like
 * `/posts/{postId}/comments/{commentId}`.
 *
 * @param parent The parent resource model type.
 */
extern dec parentResource(target: Model, parent: Model);

/**
 * Mark an operation as reading a single resource instance (HTTP GET on a resource).
 * The operation will be mapped to `GET /<collection>/{id}`.
 *
 * @param resourceType The resource model type this operation reads.
 */
extern dec reads(target: Operation, resourceType: Model);

/**
 * Mark an operation as creating a new resource in a collection (HTTP POST).
 * The operation will be mapped to `POST /<collection>`.
 *
 * @param resourceType The resource model type this operation creates.
 */
extern dec creates(target: Operation, resourceType: Model);

/**
 * Mark an operation as creating or replacing a resource (HTTP PUT).
 * The operation will be mapped to `PUT /<collection>/{id}`.
 *
 * @param resourceType The resource model type this operation creates or replaces.
 */
extern dec createsOrReplaces(target: Operation, resourceType: Model);

/**
 * Mark an operation as updating a resource (HTTP PATCH).
 * The operation will be mapped to `PATCH /<collection>/{id}`.
 *
 * @param resourceType The resource model type this operation updates.
 */
extern dec updates(target: Operation, resourceType: Model);

/**
 * Mark an operation as deleting a resource (HTTP DELETE).
 * The operation will be mapped to `DELETE /<collection>/{id}`.
 *
 * @param resourceType The resource model type this operation deletes.
 */
extern dec deletes(target: Operation, resourceType: Model);

/**
 * Mark an operation as listing resources from a collection (HTTP GET on a collection).
 * The operation will be mapped to `GET /<collection>`.
 *
 * @param resourceType The resource model type this operation lists.
 */
extern dec lists(target: Operation, resourceType: Model);

/**
 * Define a custom action on a resource instance.
 * Creates an endpoint like `POST /<collection>/{id}/<actionName>`.
 *
 * @param name The URL path segment for the action. If not provided, the operation name is used.
 */
extern dec action(target: Operation, name?: valueof string);

/**
 * Define a custom action on a resource collection.
 * Creates an endpoint like `POST /<collection>/<actionName>`.
 *
 * @param resourceType The resource model type this action operates on.
 * @param name The URL path segment for the action. If not provided, the operation name is used.
 */
extern dec collectionAction(target: Operation, resourceType: Model, name?: valueof string);

/**
 * Copy the resource key parameters onto a model.
 * Used internally by `KeysOf` and `ParentKeysOf` templates.
 *
 * @param filter If "parent", only copies parent resource keys.
 */
extern dec copyResourceKeyParameters(target: Model, filter?: valueof string);
