import { createTester } from "@typespec/compiler/testing";
import { resolvePath } from "@typespec/compiler";

export const PydanticTestLibrary = createTester(resolvePath(import.meta.dirname, "..", ".."), {
  libraries: ["@typespec/http", "@typespec/rest"],
});
