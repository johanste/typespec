import { createTestLibrary, findTestPackageRoot, TypeSpecTestLibrary } from "@typespec/compiler/testing";

export const RestApiTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec/rest-api",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
