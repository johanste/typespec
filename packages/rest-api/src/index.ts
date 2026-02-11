export { $lib } from "./lib.js";
export {
  $resource,
  $parentResource,
  $reads,
  $creates,
  $createsOrReplaces,
  $updates,
  $deletes,
  $lists,
  $action,
  $collectionAction,
  $copyResourceKeyParameters,
  getResourceTypeKey,
  getParentResource,
  getResourceOperation,
  isListOperation,
  getActionDetails,
  getCollectionActionDetails,
} from "./decorators.js";

export type {
  ResourceKey,
  ResourceOperation,
  ResourceOperationType,
  ActionDetails,
} from "./decorators.js";

export { $decorators } from "./tsp-index.js";
