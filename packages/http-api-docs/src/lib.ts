import { createTypeSpecLibrary, type JSONSchemaType } from "@typespec/compiler";

export interface HttpApiDocsEmitterOptions {
  /**
   * Name of the output markdown file.
   * @defaultValue `{service-name}.md`
   */
  "output-file"?: string;
}

const EmitterOptionsSchema: JSONSchemaType<HttpApiDocsEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "output-file": {
      type: "string",
      nullable: true,
      description: "Name of the output markdown file.",
    },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-api-docs",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema,
  },
});
