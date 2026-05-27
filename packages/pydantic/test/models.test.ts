import { describe, expect, it } from "vitest";
import { emitPydantic } from "./utils.js";

describe("pydantic emitter: basic models", () => {
  it("emits a simple model with string and int properties", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Foo {
        name: string;
        age: int32;
      }
      @get op getFoo(): Foo;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("class Foo(BaseModel):");
    expect(content).toContain("name: str");
    expect(content).toContain("age: int");
    expect(content).toContain("from pydantic import BaseModel");
  });

  it("emits optional properties with None default", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Foo {
        name: string;
        nickname?: string;
      }
      @get op getFoo(): Foo;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("name: str");
    expect(content).toContain("nickname: Optional[str]");
    expect(content).toContain("Optional");
  });

  it("emits model with default values", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Config {
        enabled?: boolean = true;
        count?: int32 = 10;
        label?: string = "default";
      }
      @get op getConfig(): Config;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("enabled: Optional[bool] = True");
    expect(content).toContain("count: Optional[int] = 10");
    expect(content).toContain('label: Optional[str] = "default"');
  });

  it("emits model with docstring", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      @doc("A user model")
      model User {
        name: string;
      }
      @get op getUser(): User;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain('"""A user model"""');
  });

  it("emits empty model with pass", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Container {
        inner: Empty;
      }
      model Empty {}
      @get op getContainer(): Container;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("class Empty(BaseModel):");
    expect(content).toContain("    pass");
  });

  it("emits model with boolean property", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Flags {
        active: boolean;
      }
      @get op getFlags(): Flags;
    `);

    const content = output["output_types.py"];
    expect(content).toContain("active: bool");
  });

  it("emits model with float property", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Measurement {
        value: float64;
      }
      @get op getMeasurement(): Measurement;
    `);

    const content = output["output_types.py"];
    expect(content).toContain("value: float");
  });

  it("emits model with bytes property", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Data {
        payload: bytes;
      }
      @get op getData(): Data;
    `);

    const content = output["output_types.py"];
    expect(content).toContain("payload: bytes");
  });
});
