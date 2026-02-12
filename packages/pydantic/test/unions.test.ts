import { describe, expect, it } from "vitest";
import { emitPydantic } from "./utils.js";

describe("pydantic emitter: unions", () => {
  it("emits named union as type alias", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      union StringOrInt { string, int32 }
      model Foo {
        value: StringOrInt;
      }
      @get op getFoo(): Foo;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("StringOrInt = Union[str, int]");
  });

  it("emits inline union as Union type", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Foo {
        value: string | int32;
      }
      @get op getFoo(): Foo;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("Union[str, int]");
  });

  it("emits nullable as Optional", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Foo {
        value: string | null;
      }
      @get op getFoo(): Foo;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("Union[str, None]");
  });
});
