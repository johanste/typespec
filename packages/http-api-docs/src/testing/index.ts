import {
  type TypeSpecTestLibrary,
  createTestLibrary,
  findTestPackageRoot,
} from "@typespec/compiler/testing";

export const HttpApiDocsTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/http-api-docs",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
