import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import type { Options } from "../../../lib/options.js";

describe("Edge cases and option behaviors", () => {
  describe("mutateInputSchema: false", () => {
    it("should not mutate the original schema object", async () => {
      const original = {
        type: "object",
        properties: {
          name: { $ref: "#/definitions/Name" },
        },
        definitions: {
          Name: {
            type: "string",
            minLength: 1,
          },
        },
      };

      // Deep clone to compare later
      const originalCopy = JSON.parse(JSON.stringify(original));

      const parser = new $RefParser();
      await parser.dereference(original, { mutateInputSchema: false });

      // The original schema should not have been modified
      expect(original).to.deep.equal(originalCopy);
      // The $ref should still be intact in the original
      expect(original.properties.name).to.have.property("$ref");
    });

    it("should mutate the original schema when mutateInputSchema is true (default)", async () => {
      const original = {
        type: "object",
        properties: {
          name: { $ref: "#/definitions/Name" },
        },
        definitions: {
          Name: {
            type: "string",
            minLength: 1,
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(original);

      // With default (mutateInputSchema: true), the original and result should be the same object
      expect(result).to.equal(original);
    });
  });

  describe("resolve.external: false", () => {
    it("should not resolve external $refs when external is false", async () => {
      const schema = {
        type: "object",
        properties: {
          internal: { $ref: "#/definitions/InternalDef" },
        },
        definitions: {
          InternalDef: {
            type: "string",
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema), {
        resolve: { external: false },
      });

      // Internal refs should still be resolved
      expect((result as any).properties.internal).to.equal((result as any).definitions.InternalDef);
    });
  });

  describe("reusing parser instances", () => {
    it("should work correctly when reusing a parser for multiple schemas", async () => {
      const parser = new $RefParser();

      const schema1 = {
        type: "object",
        properties: {
          name: { $ref: "#/definitions/Name" },
        },
        definitions: {
          Name: { type: "string" },
        },
      };

      const schema2 = {
        type: "object",
        properties: {
          count: { $ref: "#/definitions/Count" },
        },
        definitions: {
          Count: { type: "integer" },
        },
      };

      // First dereference
      const result1 = await parser.dereference(structuredClone(schema1));
      expect((result1 as any).properties.name).to.deep.equal({ type: "string" });

      // Second dereference with the same parser instance
      const result2 = await parser.dereference(structuredClone(schema2));
      expect((result2 as any).properties.count).to.deep.equal({ type: "integer" });

      // The second result should not be contaminated by the first
      expect(result2).not.to.have.nested.property("definitions.Name");
    });
  });

  describe("preservedProperties with different value types", () => {
    it("should preserve description alongside a $ref that resolves to an object", async () => {
      const schema = {
        type: "object",
        properties: {
          address: {
            $ref: "#/definitions/Address",
            description: "Shipping address",
          },
        },
        definitions: {
          Address: {
            type: "object",
            properties: {
              street: { type: "string" },
            },
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema), {
        dereference: { preservedProperties: ["description"] },
      } as Options);

      const address = (result as any).properties.address;
      expect(address.type).to.equal("object");
      expect(address.description).to.equal("Shipping address");
      expect(address.properties.street).to.deep.equal({ type: "string" });
    });

    it("should handle preservedProperties when $ref resolves to a non-object", async () => {
      const schema = {
        type: "object",
        properties: {
          name: {
            $ref: "#/definitions/StringType",
            description: "User name",
          },
        },
        definitions: {
          StringType: {
            type: "string",
            minLength: 1,
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema), {
        dereference: { preservedProperties: ["description"] },
      } as Options);

      const name = (result as any).properties.name;
      // Even though the $ref target is an object with type: "string", it's still an object
      // so preservedProperties should work
      expect(name.type).to.equal("string");
      expect(name.description).to.equal("User name");
    });
  });

  describe("onDereference callback", () => {
    it("should fire for each dereferenced $ref", async () => {
      const schema = {
        type: "object",
        properties: {
          name: { $ref: "#/definitions/Name" },
          email: { $ref: "#/definitions/Email" },
          address: { $ref: "#/definitions/Address" },
        },
        definitions: {
          Name: { type: "string" },
          Email: { type: "string", format: "email" },
          Address: {
            type: "object",
            properties: {
              street: { type: "string" },
            },
          },
        },
      };

      const dereferencedPaths: string[] = [];
      const parser = new $RefParser();
      await parser.dereference(structuredClone(schema), {
        dereference: {
          onDereference: (path: string) => {
            dereferencedPaths.push(path);
          },
        },
      });

      expect(dereferencedPaths).to.include("#/definitions/Name");
      expect(dereferencedPaths).to.include("#/definitions/Email");
      expect(dereferencedPaths).to.include("#/definitions/Address");
    });
  });

  describe("onBundle callback", () => {
    it("should fire for bundled $refs", async () => {
      const schema = {
        type: "object",
        properties: {
          a: { $ref: "#/definitions/TypeA" },
          b: { $ref: "#/definitions/TypeA" },
        },
        definitions: {
          TypeA: {
            type: "object",
            properties: {
              value: { type: "string" },
            },
          },
        },
      };

      const bundledPaths: string[] = [];
      const parser = new $RefParser();
      await parser.bundle(structuredClone(schema), {
        bundle: {
          onBundle: (path: string) => {
            bundledPaths.push(path);
          },
        },
      });

      // At least one bundled ref should be reported
      expect(bundledPaths.length).to.be.greaterThan(0);
    });
  });

  describe("excludedPathMatcher", () => {
    it("should skip dereferencing $refs in excluded paths", async () => {
      const schema = {
        type: "object",
        properties: {
          data: { $ref: "#/definitions/Data" },
          example: {
            $ref: "#/definitions/Data",
            description: "Example that should not be dereferenced",
          },
        },
        definitions: {
          Data: {
            type: "object",
            properties: {
              value: { type: "string" },
            },
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema), {
        dereference: {
          excludedPathMatcher: (path: string) => path.includes("/properties/example"),
        },
      });

      // data should be dereferenced
      expect((result as any).properties.data.type).to.equal("object");
      // example should NOT be dereferenced (should still have $ref)
      expect((result as any).properties.example).to.have.property("$ref");
    });
  });

  describe("schema with no $refs at all", () => {
    it("should return the schema unchanged for dereference", async () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer", minimum: 0 },
          email: { type: "string", format: "email" },
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["name", "email"],
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect(result).to.deep.equal(schema);
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should return the schema unchanged for bundle", async () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },
      };

      const parser = new $RefParser();
      const result = await parser.bundle(structuredClone(schema));
      expect(result).to.deep.equal(schema);
    });
  });

  describe("static method API", () => {
    it("should work with static dereference method", async () => {
      const schema = {
        type: "object",
        properties: {
          name: { $ref: "#/definitions/Name" },
        },
        definitions: {
          Name: { type: "string" },
        },
      };

      const result = await $RefParser.dereference(structuredClone(schema));
      expect((result as any).properties.name).to.deep.equal({ type: "string" });
    });

    it("should work with static bundle method", async () => {
      const schema = {
        type: "object",
        properties: {
          name: { $ref: "#/definitions/Name" },
        },
        definitions: {
          Name: { type: "string" },
        },
      };

      const result = await $RefParser.bundle(structuredClone(schema));
      expect(result).to.have.property("definitions");
    });

    it("should work with static resolve method", async () => {
      const schema = {
        type: "object",
        properties: {
          name: { $ref: "#/definitions/Name" },
        },
        definitions: {
          Name: { type: "string" },
        },
      };

      const $refs = await $RefParser.resolve(structuredClone(schema));
      expect($refs.paths().length).to.be.greaterThan(0);
    });
  });

  describe("$ref at schema root", () => {
    it("should dereference a root-level $ref", async () => {
      const schema = {
        $ref: "#/definitions/Root",
        definitions: {
          Root: {
            type: "object",
            properties: {
              name: { type: "string" },
              nested: { $ref: "#/definitions/Nested" },
            },
          },
          Nested: {
            type: "object",
            properties: {
              value: { type: "integer" },
            },
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      expect((result as any).type).to.equal("object");
      expect((result as any).properties.name).to.deep.equal({ type: "string" });
      expect((result as any).properties.nested).to.deep.equal({
        type: "object",
        properties: { value: { type: "integer" } },
      });
    });
  });

  describe("special characters in $ref paths", () => {
    it("should handle $ref with spaces in definition names", async () => {
      const schema = {
        type: "object",
        properties: {
          value: { $ref: "#/definitions/my%20type" },
        },
        definitions: {
          "my type": {
            type: "string",
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect((result as any).properties.value).to.deep.equal({ type: "string" });
    });

    it("should handle $ref with tilde-escaped characters", async () => {
      const schema = {
        type: "object",
        properties: {
          value: { $ref: "#/definitions/my~1nested~1type" },
        },
        definitions: {
          "my/nested/type": {
            type: "string",
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect((result as any).properties.value).to.deep.equal({ type: "string" });
    });

    it("should handle $ref with tilde-zero escape (literal tilde)", async () => {
      const schema = {
        type: "object",
        properties: {
          value: { $ref: "#/definitions/type~0name" },
        },
        definitions: {
          "type~name": {
            type: "integer",
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect((result as any).properties.value).to.deep.equal({ type: "integer" });
    });
  });

  describe("empty and minimal schemas", () => {
    it("should handle an empty object schema", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference({});
      expect(result).to.deep.equal({});
    });

    it("should handle a schema with only definitions (no properties)", async () => {
      const schema = {
        definitions: {
          Unused: { type: "string" },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect(result).to.deep.equal(schema);
    });

    it("should handle boolean schemas in properties", async () => {
      const schema = {
        type: "object",
        properties: {
          anything: true as any,
          nothing: false as any,
          typed: { $ref: "#/definitions/Name" },
        },
        definitions: {
          Name: { type: "string" },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect((result as any).properties.anything).to.equal(true);
      expect((result as any).properties.nothing).to.equal(false);
      expect((result as any).properties.typed).to.deep.equal({ type: "string" });
    });
  });

  describe("$refs pointing to arrays", () => {
    it("should dereference $ref pointing to an array value", async () => {
      const schema = {
        type: "object",
        properties: {
          tags: { $ref: "#/definitions/TagList" },
        },
        definitions: {
          TagList: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      expect((result as any).properties.tags).to.equal((result as any).definitions.TagList);
      expect((result as any).properties.tags.type).to.equal("array");
      expect((result as any).properties.tags.items).to.deep.equal({ type: "string" });
    });
  });

  describe("$refs pointing to deeply nested values", () => {
    it("should resolve $ref pointing to a nested property", async () => {
      const schema = {
        type: "object",
        properties: {
          streetType: { $ref: "#/definitions/Address/properties/street/type" },
        },
        definitions: {
          Address: {
            type: "object",
            properties: {
              street: {
                type: "string",
                maxLength: 100,
              },
            },
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      // The $ref points to the string "string" (the type value)
      expect((result as any).properties.streetType).to.equal("string");
    });
  });
});
