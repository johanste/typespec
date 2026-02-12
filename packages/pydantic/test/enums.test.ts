import { describe, expect, it } from "vitest";
import { emitPydantic } from "./utils.js";

describe("pydantic emitter: enums", () => {
  it("emits string enum as StrEnum", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      enum Color { Red, Green, Blue }
      model Item {
        color: Color;
      }
      @get op getItem(): Item;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("class Color(StrEnum):");
    expect(content).toContain('Red = "Red"');
    expect(content).toContain('Green = "Green"');
    expect(content).toContain('Blue = "Blue"');
  });

  it("emits enum with string values", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      enum Status {
        active: "ACTIVE",
        inactive: "INACTIVE",
      }
      model Item {
        status: Status;
      }
      @get op getItem(): Item;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("class Status(StrEnum):");
    expect(content).toContain('active = "ACTIVE"');
    expect(content).toContain('inactive = "INACTIVE"');
  });

  it("emits integer enum as IntEnum", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      enum Priority {
        low: 1,
        medium: 2,
        high: 3,
      }
      model Task {
        priority: Priority;
      }
      @get op getTask(): Task;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("class Priority(IntEnum):");
    expect(content).toContain("low = 1");
    expect(content).toContain("medium = 2");
    expect(content).toContain("high = 3");
  });

  it("emits enum with doc", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      @doc("Available colors")
      enum Color { Red, Green, Blue }
      model Item {
        color: Color;
      }
      @get op getItem(): Item;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain('"""Available colors"""');
  });
});
