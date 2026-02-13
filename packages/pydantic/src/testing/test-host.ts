import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const PydanticTestLibrary = createTester(resolvePath(import.meta.dirname, "..", ".."), {
  libraries: ["@typespec/http", "@typespec/rest"],
});
