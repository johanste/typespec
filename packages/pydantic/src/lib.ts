import { createTypeSpecLibrary, definePackageFlags, type JSONSchemaType } from "@typespec/compiler";

/**
 * Pydantic emitter options
 */
export interface PydanticEmitterOptions {
  /**
   * Name of the module for input (request) models.
   * @defaultValue "input_types"
   */
  "input-module-name"?: string;

  /**
   * Name of the module for output (response) models.
   * @defaultValue "output_types"
   */
  "output-module-name"?: string;

  /**
   * Name of the module for roundtrip (input+output) models.
   * @defaultValue "roundtrip_types"
   */
  "roundtrip-module-name"?: string;

  /**
   * When true, only emit models that are used as input or output in HTTP operations.
   * When false, emit all models defined in the program.
   * @defaultValue false
   */
  "constrain-to-used"?: boolean;
}

/**
 * Internal: Pydantic emitter options schema
 */
export const EmitterOptionsSchema: JSONSchemaType<PydanticEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "input-module-name": {
      type: "string",
      nullable: true,
      description: "Name of the module for input (request) models. Default: input_types",
    },
    "output-module-name": {
      type: "string",
      nullable: true,
      description: "Name of the module for output (response) models. Default: output_types",
    },
    "roundtrip-module-name": {
      type: "string",
      nullable: true,
      description:
        "Name of the module for roundtrip (input+output) models. Default: roundtrip_types",
    },
    "constrain-to-used": {
      type: "boolean",
      nullable: true,
      default: false,
      description:
        "When true, only emit models that are used as input or output in HTTP operations. Default: false",
    },
  },
  required: [],
};

/** Internal: TypeSpec library definition */
export const $lib = createTypeSpecLibrary({
  name: "@typespec/pydantic",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<PydanticEmitterOptions>,
  },
} as const);

/** Internal: TypeSpec flags */
export const $flags = definePackageFlags({});
