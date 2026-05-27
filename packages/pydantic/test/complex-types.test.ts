import { describe, expect, it } from "vitest";
import { emitPydantic } from "./utils.js";

describe("pydantic emitter: complex types", () => {
  it("emits array properties as List", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Foo {
        items: string[];
      }
      @get op getFoo(): Foo;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("items: List[str]");
    expect(content).toContain("from typing import");
    expect(content).toContain("List");
  });

  it("emits Record properties as Dict", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Foo {
        metadata: Record<string>;
      }
      @get op getFoo(): Foo;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("Dict[str, str]");
  });

  it("emits model references as forward references", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Parent {
        child: Child;
      }
      model Child {
        name: string;
      }
      @get op getParent(): Parent;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain('"Child"');
    expect(content).toContain("class Child(BaseModel):");
    expect(content).toContain("class Parent(BaseModel):");
  });

  it("emits enum references in model properties", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      enum Status { active, inactive }
      model User {
        name: string;
        status: Status;
      }
      @get op getUser(): User;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("class Status(StrEnum):");
    expect(content).toContain('"Status"');
  });

  it("handles multiple operations correctly", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model CreateUserRequest {
        name: string;
        email: string;
      }
      model UserResponse {
        id: string;
        name: string;
      }
      model UpdateUserRequest {
        name?: string;
      }
      @post op createUser(@body body: CreateUserRequest): UserResponse;
      @put op updateUser(@body body: UpdateUserRequest): UserResponse;
    `);

    // CreateUserRequest and UpdateUserRequest are input only
    expect(output["input_types.py"]).toBeDefined();
    expect(output["input_types.py"]).toContain("class CreateUserRequest(BaseModel):");
    expect(output["input_types.py"]).toContain("class UpdateUserRequest(BaseModel):");

    // UserResponse is output only
    expect(output["output_types.py"]).toBeDefined();
    expect(output["output_types.py"]).toContain("class UserResponse(BaseModel):");
  });

  it("emits datetime types correctly", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Event {
        createdAt: utcDateTime;
      }
      @get op getEvent(): Event;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("createdAt: datetime");
    expect(content).toContain("from datetime import datetime");
  });
});
