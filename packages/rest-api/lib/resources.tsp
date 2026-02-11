using TypeSpec.Http;

namespace TypeSpec.RestApi;

/**
 * Extracts the key properties from a resource model (properties decorated with `@key`).
 * Used to build path parameters for resource operations.
 * @template Resource The resource model type.
 */
@doc("Key properties of {name}", Resource)
@copyResourceKeyParameters
model KeysOf<Resource extends {}> {}

/**
 * Extracts the key properties from all ancestor resources in the parent chain.
 * Used to build path parameters for nested resource operations.
 * @template Resource The resource model type.
 */
@doc("Parent key properties of {name}", Resource)
@copyResourceKeyParameters("parent")
model ParentKeysOf<Resource extends {}> {}

/**
 * Combines the parent keys and instance key for identifying a specific resource instance.
 * @template Resource The resource model type.
 */
model ResourceKey<Resource extends {}> {
  ...ParentKeysOf<Resource>;
  ...KeysOf<Resource>;
}

/**
 * Parameters needed to identify a resource collection (parent keys only).
 * @template Resource The resource model type.
 */
model CollectionKey<Resource extends {}> {
  ...ParentKeysOf<Resource>;
}

// ============================================================================
// Standard CRUD Operation Interfaces
// ============================================================================

/**
 * Defines a GET operation to read a single resource by its key.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface ReadOperations<Resource extends {}, Error> {
  /**
   * Read a resource instance by key.
   */
  @reads(Resource)
  @get
  read(...ResourceKey<Resource>): Resource | Error;
}

/**
 * Defines a POST operation to create a new resource in the collection.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface CreateOperations<Resource extends {}, Error> {
  /**
   * Create a new resource.
   */
  @creates(Resource)
  @post
  create(...CollectionKey<Resource>, @body resource: Resource): Resource | Error;
}

/**
 * Defines a PUT operation to create or replace a resource.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface CreateOrReplaceOperations<Resource extends {}, Error> {
  /**
   * Create or replace a resource.
   */
  @createsOrReplaces(Resource)
  @put
  createOrReplace(...ResourceKey<Resource>, @body resource: Resource): Resource | Error;
}

/**
 * Defines a PATCH operation to update an existing resource.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface UpdateOperations<Resource extends {}, Error> {
  /**
   * Update an existing resource.
   */
  @updates(Resource)
  @patch
  update(...ResourceKey<Resource>, @body resource: Resource): Resource | Error;
}

/**
 * Defines a DELETE operation to remove a resource.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface DeleteOperations<Resource extends {}, Error> {
  /**
   * Delete a resource.
   */
  @deletes(Resource)
  @delete
  delete(...ResourceKey<Resource>): void | Error;
}

/**
 * Defines a GET operation to list all resources in a collection.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface ListOperations<Resource extends {}, Error> {
  /**
   * List resources in the collection.
   */
  @lists(Resource)
  @get
  list(...CollectionKey<Resource>): Resource[] | Error;
}

// ============================================================================
// Composite Operation Interfaces
// ============================================================================

/**
 * Operations on a single resource instance: read, update, and delete.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface InstanceOperations<Resource extends {}, Error>
  extends ReadOperations<Resource, Error>,
    UpdateOperations<Resource, Error>,
    DeleteOperations<Resource, Error> {}

/**
 * Operations on a resource collection: create and list.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface CollectionOperations<Resource extends {}, Error>
  extends CreateOperations<Resource, Error>,
    ListOperations<Resource, Error> {}

/**
 * Full CRUD operations: create, read, update, delete, and list.
 * @template Resource The resource model type.
 * @template Error The error response type.
 */
interface CrudOperations<Resource extends {}, Error>
  extends InstanceOperations<Resource, Error>,
    CollectionOperations<Resource, Error> {}
