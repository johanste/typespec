import { describe, expect, it } from "vitest";
import { emitPydantic } from "./utils.js";

describe("pydantic emitter: constraints", () => {
  describe("string constraints", () => {
    it("emits minLength and maxLength", async () => {
      const output = await emitPydantic(`
        using TypeSpec.Http;
        @route("/test")
        namespace TestService;
        model User {
          @minLength(1)
          @maxLength(100)
          name: string;
        }
        @get op getUser(): User;
      `);

      const content = output["output_types.py"];
      expect(content).toBeDefined();
      expect(content).toContain("min_length=1");
      expect(content).toContain("max_length=100");
      expect(content).toContain("Field(");
    });

    it("emits pattern constraint", async () => {
      const output = await emitPydantic(`
        using TypeSpec.Http;
        @route("/test")
        namespace TestService;
        model User {
          @pattern("^[a-zA-Z]+$")
          name: string;
        }
        @get op getUser(): User;
      `);

      const content = output["output_types.py"];
      expect(content).toBeDefined();
      expect(content).toContain('pattern="^[a-zA-Z]+$"');
    });
  });

  describe("numeric constraints", () => {
    it("emits minValue and maxValue", async () => {
      const output = await emitPydantic(`
        using TypeSpec.Http;
        @route("/test")
        namespace TestService;
        model Score {
          @minValue(0)
          @maxValue(100)
          value: int32;
        }
        @get op getScore(): Score;
      `);

      const content = output["output_types.py"];
      expect(content).toBeDefined();
      expect(content).toContain("ge=0");
      expect(content).toContain("le=100");
    });

    it("emits exclusive min and max values", async () => {
      const output = await emitPydantic(`
        using TypeSpec.Http;
        @route("/test")
        namespace TestService;
        model Range {
          @minValueExclusive(0)
          @maxValueExclusive(100)
          value: float64;
        }
        @get op getRange(): Range;
      `);

      const content = output["output_types.py"];
      expect(content).toBeDefined();
      expect(content).toContain("gt=0");
      expect(content).toContain("lt=100");
    });
  });

  describe("array constraints", () => {
    it("emits minItems and maxItems", async () => {
      const output = await emitPydantic(`
        using TypeSpec.Http;
        @route("/test")
        namespace TestService;
        model Collection {
          @minItems(1)
          @maxItems(50)
          items: string[];
        }
        @get op getCollection(): Collection;
      `);

      const content = output["output_types.py"];
      expect(content).toBeDefined();
      expect(content).toContain("min_length=1");
      expect(content).toContain("max_length=50");
    });
  });

  it("emits property documentation as field description", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model User {
        @doc("The user's full name")
        name: string;
      }
      @get op getUser(): User;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain('description="The user\'s full name"');
  });

  it("combines multiple constraints with Field", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model User {
        @minLength(1)
        @maxLength(100)
        @pattern("^[a-zA-Z ]+$")
        @doc("User name")
        name: string;
      }
      @get op getUser(): User;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("Field(");
    expect(content).toContain("min_length=1");
    expect(content).toContain("max_length=100");
    expect(content).toContain('pattern="^[a-zA-Z ]+$"');
    expect(content).toContain('description="User name"');
  });
});
