import { resolvePath, type Diagnostic } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import type { PydanticEmitterOptions } from "../src/lib.js";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/rest", "@typespec/pydantic"],
})
  .import("@typespec/http")
  .import("@typespec/rest")
  .emit("@typespec/pydantic");

export async function emitPydanticFor(
  code: string,
  options: PydanticEmitterOptions = {},
): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const [{ outputs }, diagnostics] = await Tester.compileAndDiagnose(code, {
    compilerOptions: {
      options: { "@typespec/pydantic": options as any },
    },
  });
  return [outputs, diagnostics];
}

export async function emitPydantic(
  code: string,
  options: PydanticEmitterOptions = {},
): Promise<Record<string, string>> {
  const [outputs, diagnostics] = await emitPydanticFor(code, options);
  expectDiagnosticEmpty(diagnostics);
  return outputs;
}
