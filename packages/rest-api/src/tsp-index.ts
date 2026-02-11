import {
  $action,
  $collectionAction,
  $copyResourceKeyParameters,
  $creates,
  $createsOrReplaces,
  $deletes,
  $lists,
  $parentResource,
  $reads,
  $resource,
  $updates,
} from "./decorators.js";

export const $decorators = {
  "TypeSpec.RestApi": {
    resource: $resource,
    parentResource: $parentResource,
    reads: $reads,
    creates: $creates,
    createsOrReplaces: $createsOrReplaces,
    updates: $updates,
    deletes: $deletes,
    lists: $lists,
    action: $action,
    collectionAction: $collectionAction,
    copyResourceKeyParameters: $copyResourceKeyParameters,
  },
};
