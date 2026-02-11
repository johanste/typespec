import { describe, expect, it } from "vitest";
import { emitMarkdownFor } from "./test-host.js";

describe("http-api-docs emitter", () => {
  it("emits markdown with service title", async () => {
    const markdown = await emitMarkdownFor(`
      @service(#{title: "Pet Store"})
      @route("/")
      namespace PetStore {
        op list(): string;
      }
    `);

    expect(markdown).toContain("# Pet Store API Reference");
  });

  it("emits operation with verb and path", async () => {
    const markdown = await emitMarkdownFor(`
      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op list(): string;
      }
    `);

    expect(markdown).toContain("GET /pets");
  });

  it("emits path parameters", async () => {
    const markdown = await emitMarkdownFor(`
      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op read(@path id: string): string;
      }
    `);

    expect(markdown).toContain("#### Parameters");
    expect(markdown).toContain("| id | path |");
  });

  it("emits query parameters", async () => {
    const markdown = await emitMarkdownFor(`
      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op list(@query limit: int32): string;
      }
    `);

    expect(markdown).toContain("| limit | query |");
  });

  it("emits request body with JSON example", async () => {
    const markdown = await emitMarkdownFor(`
      model Pet {
        name: string;
        age: int32;
      }

      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @post op create(@body pet: Pet): Pet;
      }
    `);

    expect(markdown).toContain("#### Request Body");
    expect(markdown).toContain('"name": "string"');
    expect(markdown).toContain('"age": 0');
  });

  it("emits response body with JSON example", async () => {
    const markdown = await emitMarkdownFor(`
      model Pet {
        name: string;
        age: int32;
      }

      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op read(@path id: string): Pet;
      }
    `);

    expect(markdown).toContain("#### Responses");
    expect(markdown).toContain('"name": "string"');
    expect(markdown).toContain('"age": 0');
  });

  it("emits documentation from @doc decorator", async () => {
    const markdown = await emitMarkdownFor(`
      @service(#{title: "My API"})
      @doc("A sample API for managing pets")
      @route("/pets")
      namespace MyAPI {
        @doc("List all available pets")
        @get op list(): string;
      }
    `);

    expect(markdown).toContain("A sample API for managing pets");
    expect(markdown).toContain("List all available pets");
  });

  it("emits response status codes", async () => {
    const markdown = await emitMarkdownFor(`
      model Pet {
        name: string;
      }

      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op read(@path id: string): {
          @statusCode statusCode: 200;
          @body body: Pet;
        };
      }
    `);

    expect(markdown).toContain("##### 200");
  });

  it("emits example for nested models", async () => {
    const markdown = await emitMarkdownFor(`
      model Address {
        street: string;
        city: string;
      }

      model Person {
        name: string;
        address: Address;
      }

      @service(#{title: "My API"})
      @route("/people")
      namespace MyAPI {
        @get op read(@path id: string): Person;
      }
    `);

    expect(markdown).toContain('"street": "string"');
    expect(markdown).toContain('"city": "string"');
  });

  it("emits example for array types", async () => {
    const markdown = await emitMarkdownFor(`
      model Pet {
        name: string;
      }

      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op list(): Pet[];
      }
    `);

    // Should have array in the response example
    expect(markdown).toContain("[");
    expect(markdown).toContain('"name": "string"');
  });

  it("emits example for enum types", async () => {
    const markdown = await emitMarkdownFor(`
      enum Color {
        Red: "red",
        Blue: "blue",
      }

      model Pet {
        name: string;
        color: Color;
      }

      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op read(@path id: string): Pet;
      }
    `);

    expect(markdown).toContain('"color": "red"');
  });

  it("emits example for optional properties", async () => {
    const markdown = await emitMarkdownFor(`
      model Pet {
        name: string;
        nickname?: string;
      }

      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op read(@path id: string): Pet;
      }
    `);

    expect(markdown).toContain("| nickname |");
    expect(markdown).toContain("No");
  });

  it("emits example for boolean and date types", async () => {
    const markdown = await emitMarkdownFor(`
      model Event {
        active: boolean;
        createdAt: utcDateTime;
      }

      @service(#{title: "My API"})
      @route("/events")
      namespace MyAPI {
        @get op read(@path id: string): Event;
      }
    `);

    expect(markdown).toContain('"active": false');
    expect(markdown).toContain('"createdAt": "2024-01-01T00:00:00Z"');
  });

  it("handles multiple operations", async () => {
    const markdown = await emitMarkdownFor(`
      model Pet {
        name: string;
      }

      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @get op list(): Pet[];
        @get op read(@path id: string): Pet;
        @post op create(@body pet: Pet): Pet;
      }
    `);

    expect(markdown).toContain("GET /pets");
    expect(markdown).toContain("GET /pets/{id}");
    expect(markdown).toContain("POST /pets");
  });

  it("emits property descriptions in body tables", async () => {
    const markdown = await emitMarkdownFor(`
      model Pet {
        @doc("The name of the pet")
        name: string;
        @doc("Age in years")
        age: int32;
      }

      @service(#{title: "My API"})
      @route("/pets")
      namespace MyAPI {
        @post op create(@body pet: Pet): Pet;
      }
    `);

    expect(markdown).toContain("The name of the pet");
    expect(markdown).toContain("Age in years");
  });
});
