import { describe, expect, it } from "vitest";
import { emitPydantic } from "./utils.js";

describe("pydantic emitter: input/output/roundtrip categorization", () => {
  it("categorizes request body model as input", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model CreateRequest {
        name: string;
      }
      model CreateResponse {
        id: string;
      }
      @post op create(@body body: CreateRequest): CreateResponse;
    `);

    expect(output["input_types.py"]).toBeDefined();
    expect(output["input_types.py"]).toContain("class CreateRequest(BaseModel):");
    expect(output["output_types.py"]).toBeDefined();
    expect(output["output_types.py"]).toContain("class CreateResponse(BaseModel):");
  });

  it("categorizes model used in both request and response as roundtrip", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model User {
        name: string;
        age: int32;
      }
      @post op createUser(@body body: User): User;
    `);

    expect(output["roundtrip_types.py"]).toBeDefined();
    expect(output["roundtrip_types.py"]).toContain("class User(BaseModel):");
    // Should NOT appear in input or output
    expect(output["input_types.py"]).toBeUndefined();
    expect(output["output_types.py"]).toBeUndefined();
  });

  it("categorizes response-only model as output", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Result {
        value: string;
      }
      @get op getResult(): Result;
    `);

    expect(output["output_types.py"]).toBeDefined();
    expect(output["output_types.py"]).toContain("class Result(BaseModel):");
  });

  it("puts uncategorized models in roundtrip when constrain-to-used is false", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Unused {
        data: string;
      }
      model Used {
        value: string;
      }
      @get op getUsed(): Used;
    `);

    // Unused model should go to roundtrip since it's not used in any operation
    expect(output["roundtrip_types.py"]).toBeDefined();
    expect(output["roundtrip_types.py"]).toContain("class Unused(BaseModel):");
    expect(output["output_types.py"]).toBeDefined();
    expect(output["output_types.py"]).toContain("class Used(BaseModel):");
  });

  it("excludes uncategorized models when constrain-to-used is true", async () => {
    const output = await emitPydantic(
      `
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Unused {
        data: string;
      }
      model Used {
        value: string;
      }
      @get op getUsed(): Used;
    `,
      { "constrain-to-used": true },
    );

    // Unused model should be excluded
    expect(output["output_types.py"]).toBeDefined();
    expect(output["output_types.py"]).toContain("class Used(BaseModel):");
    const roundtrip = output["roundtrip_types.py"];
    if (roundtrip) {
      expect(roundtrip).not.toContain("class Unused(BaseModel):");
    }
  });

  it("includes referenced models transitively", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Address {
        street: string;
        city: string;
      }
      model User {
        name: string;
        address: Address;
      }
      @get op getUser(): User;
    `);

    // Both User and Address should be in output since Address is referenced by User
    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("class User(BaseModel):");
    expect(content).toContain("class Address(BaseModel):");
  });
});
