import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec/rest-api",
  diagnostics: {
    "resource-missing-key": {
      severity: "error",
      messages: {
        default: `Model type '{modelName}' is used as a resource but does not have a property decorated with @key.`,
      },
    },
    "duplicate-key": {
      severity: "error",
      messages: {
        default: `Resource type '{resourceName}' has more than one property decorated with @key.`,
      },
    },
    "circular-parent-resource": {
      severity: "error",
      messages: {
        default: `Resource type has a circular parent relationship: {cycle}`,
      },
    },
    "invalid-action-name": {
      severity: "error",
      messages: {
        default: `Action name cannot be empty.`,
      },
    },
    "not-key-type": {
      severity: "error",
      messages: {
        default: `Template argument must be a model type with a @key property.`,
      },
    },
  },
  state: {
    resource: { description: "State for @resource decorator" },
    parentResource: { description: "State for @parentResource decorator" },
    resourceOperations: { description: "State for resource operation decorators" },
    actions: { description: "State for @action decorator" },
    collectionActions: { description: "State for @collectionAction decorator" },
    actionSegment: { description: "State for action segment tracking" },
    segments: { description: "State for URL segment tracking" },
  },
} as const);

export const { reportDiagnostic, createDiagnostic, stateKeys: RestApiStateKeys } = $lib;
