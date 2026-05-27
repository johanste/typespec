import { describe, expect, it } from "vitest";
import { emitPydantic } from "./utils.js";

describe("pydantic emitter: inheritance", () => {
  it("emits model extending another model", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Base {
        id: string;
      }
      model Child extends Base {
        name: string;
      }
      @get op getChild(): Child;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    expect(content).toContain("class Base(BaseModel):");
    expect(content).toContain("class Child(Base):");
    expect(content).toContain("name: str");
  });

  it("orders base class before derived class", async () => {
    const output = await emitPydantic(`
      using TypeSpec.Http;
      @route("/test")
      namespace TestService;
      model Child extends Base {
        name: string;
      }
      model Base {
        id: string;
      }
      @get op getChild(): Child;
    `);

    const content = output["output_types.py"];
    expect(content).toBeDefined();
    const baseIdx = content.indexOf("class Base(BaseModel):");
    const childIdx = content.indexOf("class Child(Base):");
    expect(baseIdx).toBeLessThan(childIdx);
  });
});
