import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const ApiTester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/rest", "@typespec/http-api-docs"],
});

export const SimpleTester = ApiTester.import("@typespec/http", "@typespec/rest", "@typespec/http-api-docs")
  .using("Http")
  .emit("@typespec/http-api-docs");

export async function emitMarkdownFor(code: string, options: Record<string, unknown> = {}): Promise<string> {
  const host = await SimpleTester.createInstance();
  const { outputs } = await host.compile(code, {
    compilerOptions: {
      options: { "@typespec/http-api-docs": { ...options, "output-file": "api.md" } },
    },
  });

  return outputs["api.md"] ?? "";
}
