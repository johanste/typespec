import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getResourceTypeKey, getParentResource, getResourceOperation } from "../src/decorators.js";
import { Tester, compileOperations, getRoutesFor } from "./test-host.js";

describe("rest-api: @resource decorator", () => {
  it("emits a diagnostic when a @key property is not found", async () => {
    const diagnostics = await Tester.diagnose(`
      @resource("things")
      model Thing {
        id: string;
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/rest-api/resource-missing-key",
    });
  });

  it("applies segment to key property", async () => {
    const { Thing, program } = await Tester.compile(t.code`
      @resource("things")
      model ${t.model("Thing")} {
        @key
        id: string;
      }
    `);

    const key = getResourceTypeKey(program, Thing);
    ok(key, "No key property found.");
    strictEqual(key.keyProperty.name, "id");
  });

  it("finds key in base model", async () => {
    const { Thing, program } = await Tester.compile(t.code`
      model BaseThing {
        @key
        id: string;
      }

      @resource("things")
      model ${t.model("Thing")} extends BaseThing {
        extra: string;
      }
    `);

    const key = getResourceTypeKey(program, Thing);
    ok(key, "No key property found.");
  });

  it("reports duplicate key", async () => {
    const diagnostics = await Tester.diagnose(`
      @resource("things")
      model Thing {
        @key id: string;
        @key name: string;
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/rest-api/duplicate-key",
    });
  });
});

describe("rest-api: @parentResource decorator", () => {
  it("sets parent resource", async () => {
    const { Child, Parent, program } = await Tester.compile(t.code`
      @resource("parents")
      model ${t.model("Parent")} {
        @key parentId: string;
      }

      @resource("children")
      @parentResource(Parent)
      model ${t.model("Child")} {
        @key childId: string;
      }
    `);

    const parent = getParentResource(program, Child);
    ok(parent);
    strictEqual(parent, Parent);
  });

  it("detects circular parent resource", async () => {
    const diagnostics = await Tester.diagnose(`
      @service namespace My;

      @resource("A")
      @parentResource(A)
      model A { @key a: string }
    `);

    expectDiagnostics(diagnostics, [
      {
        code: "@typespec/rest-api/circular-parent-resource",
      },
    ]);
  });

  it("detects circular parents across multiple resources", async () => {
    const diagnostics = await Tester.diagnose(`
      @service namespace My;

      @resource("A")
      @parentResource(B)
      model A { @key a: string }

      @resource("B")
      @parentResource(A)
      model B { @key b: string }
    `);

    const circularDiags = diagnostics.filter(
      (d) => d.code === "@typespec/rest-api/circular-parent-resource",
    );
    ok(circularDiags.length >= 1, "Expected at least one circular parent diagnostic");
  });
});

describe("rest-api: resource operation decorators", () => {
  it("@reads sets read operation", async () => {
    const { read, program } = await Tester.compile(t.code`
      @resource("things")
      model Thing {
        @key id: string;
      }

      @reads(Thing)
      op ${t.op("read")}(@path id: string): Thing;
    `);

    const resOp = getResourceOperation(program, read);
    ok(resOp);
    strictEqual(resOp.operation, "read");
  });

  it("@creates sets create operation", async () => {
    const { create, program } = await Tester.compile(t.code`
      @resource("things")
      model Thing {
        @key id: string;
      }

      @creates(Thing)
      op ${t.op("create")}(@body thing: Thing): Thing;
    `);

    const resOp = getResourceOperation(program, create);
    ok(resOp);
    strictEqual(resOp.operation, "create");
  });

  it("@updates sets update operation", async () => {
    const [result, diagnostics] = await Tester.compileAndDiagnose(t.code`
      @resource("things")
      model Thing {
        @key id: string;
      }

      @updates(Thing)
      op ${t.op("update")}(@path id: string, @body thing: Thing): Thing;
    `);

    const resOp = getResourceOperation(result.program, result.update);
    ok(resOp);
    strictEqual(resOp.operation, "update");
  });

  it("@deletes sets delete operation", async () => {
    const { del, program } = await Tester.compile(t.code`
      @resource("things")
      model Thing {
        @key id: string;
      }

      @deletes(Thing)
      op ${t.op("del")}(@path id: string): void;
    `);

    const resOp = getResourceOperation(program, del);
    ok(resOp);
    strictEqual(resOp.operation, "delete");
  });

  it("@lists sets list operation", async () => {
    const { listThings, program } = await Tester.compile(t.code`
      @resource("things")
      model Thing {
        @key id: string;
      }

      @lists(Thing)
      op ${t.op("listThings")}(): Thing[];
    `);

    const resOp = getResourceOperation(program, listThings);
    ok(resOp);
    strictEqual(resOp.operation, "list");
  });

  it("@createsOrReplaces sets createOrReplace operation", async () => {
    const { replace, program } = await Tester.compile(t.code`
      @resource("things")
      model Thing {
        @key id: string;
      }

      @createsOrReplaces(Thing)
      op ${t.op("replace")}(@path id: string, @body thing: Thing): Thing;
    `);

    const resOp = getResourceOperation(program, replace);
    ok(resOp);
    strictEqual(resOp.operation, "createOrReplace");
  });
});

describe("rest-api: @action decorator", () => {
  it("emits diagnostic for empty action name", async () => {
    const diagnostics = await Tester.diagnose(`
      @resource("things")
      model Thing {
        @key id: string;
      }

      @action("")
      op doSomething(): void;
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/rest-api/invalid-action-name",
    });
  });
});

describe("rest-api: CRUD operation templates", () => {
  it("ReadOperations generates GET on resource instance", async () => {
    const [ops, diagnostics] = await compileOperations(`
      @resource("things")
      model Thing {
        @key("thingId")
        id: string;
        name: string;
      }

      @error model Error {}

      interface Things extends ReadOperations<Thing, Error> {}
    `);

    strictEqual(ops.length, 1);
    strictEqual(ops[0].verb, "get");
  });

  it("CreateOperations generates POST on collection", async () => {
    const [ops, diagnostics] = await compileOperations(`
      @resource("things")
      model Thing {
        @key("thingId")
        id: string;
        name: string;
      }

      @error model Error {}

      interface Things extends CreateOperations<Thing, Error> {}
    `);

    strictEqual(ops.length, 1);
    strictEqual(ops[0].verb, "post");
  });

  it("DeleteOperations generates DELETE on resource instance", async () => {
    const [ops, diagnostics] = await compileOperations(`
      @resource("things")
      model Thing {
        @key("thingId")
        id: string;
      }

      @error model Error {}

      interface Things extends DeleteOperations<Thing, Error> {}
    `);

    strictEqual(ops.length, 1);
    strictEqual(ops[0].verb, "delete");
  });

  it("ListOperations generates GET on collection", async () => {
    const [ops, diagnostics] = await compileOperations(`
      @resource("things")
      model Thing {
        @key("thingId")
        id: string;
      }

      @error model Error {}

      interface Things extends ListOperations<Thing, Error> {}
    `);

    strictEqual(ops.length, 1);
    strictEqual(ops[0].verb, "get");
  });

  it("CrudOperations generates all CRUD operations", async () => {
    const [ops, diagnostics] = await compileOperations(`
      @resource("things")
      model Thing {
        @key("thingId")
        id: string;
        name: string;
      }

      @error model Error {}

      interface Things extends CrudOperations<Thing, Error> {}
    `);

    strictEqual(ops.length, 5);
    const verbs = ops.map((o) => o.verb).sort();
    deepStrictEqual(verbs, ["delete", "get", "get", "patch", "post"]);
  });
});
