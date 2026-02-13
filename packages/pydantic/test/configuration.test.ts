import { describe, expect, it } from "vitest";
import { emitPydantic } from "./utils.js";

describe("pydantic emitter: configuration", () => {
  it("allows overriding input module name", async () => {
    const output = await emitPydantic(
      `
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Req { name: string; }
      model Res { id: string; }
      @post op create(@body body: Req): Res;
    `,
      { "input-module-name": "my_input" },
    );

    expect(output["my_input.py"]).toBeDefined();
    expect(output["my_input.py"]).toContain("class Req(BaseModel):");
    expect(output["input_types.py"]).toBeUndefined();
  });

  it("allows overriding output module name", async () => {
    const output = await emitPydantic(
      `
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Req { name: string; }
      model Res { id: string; }
      @post op create(@body body: Req): Res;
    `,
      { "output-module-name": "my_output" },
    );

    expect(output["my_output.py"]).toBeDefined();
    expect(output["my_output.py"]).toContain("class Res(BaseModel):");
    expect(output["output_types.py"]).toBeUndefined();
  });

  it("allows overriding roundtrip module name", async () => {
    const output = await emitPydantic(
      `
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Shared { value: string; }
      @post op echo(@body body: Shared): Shared;
    `,
      { "roundtrip-module-name": "shared_models" },
    );

    expect(output["shared_models.py"]).toBeDefined();
    expect(output["shared_models.py"]).toContain("class Shared(BaseModel):");
    expect(output["roundtrip_types.py"]).toBeUndefined();
  });

  it("allows overriding all module names simultaneously", async () => {
    const output = await emitPydantic(
      `
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model InOnly { data: string; }
      model OutOnly { result: string; }
      model Both { value: string; }
      @post op doSomething(@body body: InOnly): OutOnly;
      @post op doRoundtrip(@body body: Both): Both;
    `,
      {
        "input-module-name": "req",
        "output-module-name": "res",
        "roundtrip-module-name": "shared",
      },
    );

    expect(output["req.py"]).toBeDefined();
    expect(output["req.py"]).toContain("class InOnly(BaseModel):");
    expect(output["res.py"]).toBeDefined();
    expect(output["res.py"]).toContain("class OutOnly(BaseModel):");
    expect(output["shared.py"]).toBeDefined();
    expect(output["shared.py"]).toContain("class Both(BaseModel):");
  });

  it("constrains output to only used models", async () => {
    const output = await emitPydantic(
      `
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model UsedModel { name: string; }
      model UnusedModel { data: string; }
      @get op get(): UsedModel;
    `,
      { "constrain-to-used": true },
    );

    expect(output["output_types.py"]).toBeDefined();
    expect(output["output_types.py"]).toContain("class UsedModel(BaseModel):");

    // UnusedModel should NOT appear anywhere
    for (const content of Object.values(output)) {
      expect(content).not.toContain("UnusedModel");
    }
  });
});
