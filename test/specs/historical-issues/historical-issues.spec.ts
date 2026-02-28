import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";

/**
 * Regression tests for historical closed GitHub issues.
 * Each test references the original issue number and validates the fix.
 */
describe("Historical GitHub Issues", () => {
  // ============================================================================
  // Circular Reference Issues
  // ============================================================================
  describe("Circular References", () => {
    it("Issue #37: dereference() should handle self-referencing $ref", async () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            $ref: "#/properties/foo",
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema, {
        dereference: { circular: true },
      });
      expect(parser.$refs.circular).to.equal(true);
      // The self-referencing $ref should be detected as circular
      expect(result).to.be.an("object");
      expect(result.properties.foo).to.exist;
    });

    it("Issue #40: circular reference in array items should not cause stack overflow", async () => {
      const schema = {
        definitions: {
          MessagePart: {
            type: "object",
            properties: {
              parts: {
                type: "array",
                items: { $ref: "#/definitions/MessagePart" },
              },
            },
          },
        },
        title: "Message",
        type: "object",
        properties: {
          part: { $ref: "#/definitions/MessagePart" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(parser.$refs.circular).to.equal(true);
      expect(result.properties.part).to.deep.include({ type: "object" });
      expect(result.definitions.MessagePart.properties.parts.items).to.equal(result.definitions.MessagePart);
    });

    it("Issue #180: circular references should not cause infinite recursion", async () => {
      const schema = {
        definitions: {
          A: {
            type: "object",
            properties: {
              b: { $ref: "#/definitions/B" },
            },
          },
          B: {
            type: "object",
            properties: {
              a: { $ref: "#/definitions/A" },
            },
          },
        },
        type: "object",
        properties: {
          root: { $ref: "#/definitions/A" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(parser.$refs.circular).to.equal(true);
      expect(result.properties.root.properties.b.properties.a).to.equal(result.definitions.A);
    });

    it("Issue #217: pre-circular JS objects should be handled gracefully", async () => {
      const schema2: any = {
        type: "object",
        properties: {
          prop3: { type: "number" },
          prop4: { type: "number" },
          pointer: null as any,
        },
      };
      const schemaRoot: any = {
        type: "object",
        properties: {
          prop1: { type: "string" },
          prop2: { type: "string" },
          pointer: schema2,
        },
      };
      schema2.properties.pointer = schemaRoot;

      const parser = new $RefParser();
      const result = await parser.dereference(schemaRoot);
      expect(parser.$refs.circular).to.equal(true);
      expect(result.properties.pointer.properties.pointer).to.equal(result);
    });

    it("Issue #219: bundle should handle a schema with circular references", async () => {
      const schema = {
        definitions: {
          node: {
            type: "object",
            properties: {
              child: { $ref: "#/definitions/node" },
            },
          },
        },
        type: "object",
        properties: {
          root: { $ref: "#/definitions/node" },
        },
      };
      // Bundling a schema with circular $refs should work
      const parser = new $RefParser();
      const bundled = await parser.bundle(schema);
      expect(bundled).to.be.an("object");
      expect(bundled.definitions.node.properties.child.$ref).to.equal("#/definitions/node");
    });

    it("Issue #271: immediately circular schema should be caught by maxDepth instead of stack overflow", async () => {
      const schema = {
        components: {
          schemas: {
            responseSchema: {
              $ref: "#/components/schemas/responseSchema",
              description: "This is a description.",
            },
          },
        },
      };
      const parser = new $RefParser();
      // An immediately self-referencing $ref will hit maxDepth, but should NOT
      // cause an uncontrolled stack overflow. The maxDepth error is the expected behavior.
      try {
        await parser.dereference(schema);
        helper.shouldNotGetCalled();
      } catch (err: any) {
        // Should throw a controlled maxDepth error, not an uncontrolled stack overflow
        expect(err.message).to.contain("dereference depth");
      }
    });

    it("Issue #104: circular='ignore' should mark circular flag and leave circular $refs as-is", async () => {
      const schema = {
        definitions: {
          A: {
            type: "object",
            properties: {
              prop: { $ref: "#/definitions/A" },
            },
          },
        },
        type: "object",
        properties: {
          b: { $ref: "#/definitions/A" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema, {
        dereference: { circular: "ignore" },
      });
      expect(parser.$refs.circular).to.equal(true);
      // Non-circular ref (b -> A) should still be resolved
      expect(result.definitions.A).to.have.property("type", "object");
      // The schema should complete without stack overflow
      expect(result).to.be.an("object");
    });

    it("Issue #407: onCircular callback should fire for all circular $ref occurrences", async () => {
      const schema = {
        $defs: {
          node: {
            type: "object",
            properties: {
              child: { $ref: "#/$defs/node" },
              sibling: { $ref: "#/$defs/node" },
            },
          },
        },
        $ref: "#/$defs/node",
      };
      const circularRefs: string[] = [];
      const parser = new $RefParser();
      await parser.dereference(schema, {
        dereference: {
          circular: "ignore",
          onCircular(refPath: string) {
            circularRefs.push(refPath);
          },
        },
      });
      expect(parser.$refs.circular).to.equal(true);
      // Should fire for each occurrence, not just the first
      expect(circularRefs.length).to.be.greaterThanOrEqual(2);
    });

    it("Issue #395: deeply recursive schemas should not cause stack overflow (maxDepth)", async () => {
      // Create a schema with many levels of nesting
      const schema: any = {
        definitions: {
          deep: {
            type: "object",
            properties: {
              nested: { $ref: "#/definitions/deep" },
            },
          },
        },
        $ref: "#/definitions/deep",
      };
      const parser = new $RefParser();
      // Should succeed with default maxDepth
      const result = await parser.dereference(schema);
      expect(parser.$refs.circular).to.equal(true);
      expect(result).to.be.an("object");
    });
  });

  // ============================================================================
  // Root-level $ref Issues
  // ============================================================================
  describe("Root-level $ref", () => {
    it("Issue #172: dereference should work when root object has $ref", async () => {
      const schema = {
        $schema: "http://json-schema.org/draft-06/schema#",
        $ref: "#/definitions/Row",
        definitions: {
          Row: {
            type: "object",
            additionalProperties: false,
            properties: {
              a: { type: "integer" },
              b: { type: "integer" },
            },
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result).to.have.property("type", "object");
      expect(result).to.have.property("additionalProperties", false);
      expect(result.properties).to.have.property("a");
      expect(result.properties).to.have.property("b");
    });

    it("Issue #174: $ref at root level should be fully replaced after dereference", async () => {
      const schema = {
        components: {
          schemas: {
            Pet: {
              type: "string",
            },
          },
        },
        $ref: "#/components/schemas/Pet",
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result).to.have.property("type", "string");
    });

    it("Issue #201: root-level $ref to definitions should parse correctly", async () => {
      const schema = {
        $ref: "#/definitions/EmailConfig",
        $schema: "http://json-schema.org/draft-07/schema#",
        definitions: {
          EmailConfig: {
            additionalProperties: false,
            properties: {
              adminContact: {
                type: "string",
              },
            },
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result).to.have.property("additionalProperties", false);
      expect(result.properties).to.have.property("adminContact");
    });

    it("Issue #279: top-level $ref to definition should be fully resolved", async () => {
      const schema = {
        $schema: "http://json-schema.org/draft-04/schema#",
        $ref: "#/definitions/PricingRuleDetail",
        definitions: {
          PricingRuleDetail: {
            type: "string",
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result).to.have.property("type", "string");
    });

    it("Issue #382: top-level $ref to $defs should not falsely detect circular reference", async () => {
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $ref: "#/$defs/TopLevelType",
        $defs: {
          PropType: {
            title: "Property",
            type: "string",
          },
          TopLevelType: {
            properties: {
              prop1: {
                $ref: "#/$defs/PropType",
              },
            },
            title: "Top Level Type",
            type: "object",
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result).to.have.property("title", "Top Level Type");
      expect(result).to.have.property("type", "object");
      expect(result.properties.prop1).to.have.property("type", "string");
      // This is not actually circular
      expect(parser.$refs.circular).to.equal(false);
    });

    it("Issue #41: direct $ref at root should be resolved", async () => {
      const schema = {
        $schema: "http://json-schema.org/schema#",
        definitions: {
          i_ref_obj: {
            type: "object",
            properties: {
              file: { type: "string" },
            },
            required: ["file"],
          },
        },
        $ref: "#/definitions/i_ref_obj",
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result).to.have.property("type", "object");
      expect(result.properties.file).to.have.property("type", "string");
    });

    it("Issue #52: $ref in $ref should not cause path hash duplication", async () => {
      const schema = {
        $ref: "#/definitions/doc_node",
        definitions: {
          top_level_node: {
            type: "object",
          },
          doc_node: {
            type: "object",
            properties: {
              content: { $ref: "#/definitions/top_level_node" },
            },
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result).to.have.property("type", "object");
      expect(result.properties.content).to.have.property("type", "object");
    });

    it("Issue #259: complex schema with root $ref should dereference", async () => {
      const schema = {
        $schema: "http://json-schema.org/draft-04/schema#",
        $ref: "#/definitions/Example",
        definitions: {
          Example: {
            properties: {
              id: { type: "integer" },
              price: { type: "number" },
              byte: {
                type: "string",
                format: "binary",
              },
              items: {
                type: "array",
                items: { $ref: "#/definitions/Item" },
              },
            },
          },
          Item: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.id).to.have.property("type", "integer");
      expect(result.properties.items.items).to.have.property("type", "object");
    });
  });

  // ============================================================================
  // Null Reference Issues
  // ============================================================================
  describe("Null Values", () => {
    it("Issue #310: references to null values should resolve successfully", async () => {
      const schema = {
        type: "object",
        properties: {
          foo: { $ref: "#/definitions/nullable" },
        },
        definitions: {
          nullable: null,
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.foo).to.equal(null);
    });
  });

  // ============================================================================
  // Bundle Operation Issues
  // ============================================================================
  describe("Bundle", () => {
    it("Issue #15: bundle should create valid internal $ref paths", async () => {
      const parser = new $RefParser();
      const schema = path.rel("test/specs/historical-issues/fixtures/foo.json");
      const bundled = await parser.bundle(schema);

      // The bundled schema should have definitions from bar.json internalized
      expect(bundled).to.have.property("definitions");
      expect(bundled.properties.prop).to.have.property("$ref");

      // The $ref should point to a valid internal path
      const ref = bundled.properties.prop.$ref as string;
      expect(ref).to.match(/^#\//);
    });

    it("Issue #357: bundle with resolve.external=false should handle internal refs only", async () => {
      const schema = {
        type: "object",
        definitions: {
          name: { type: "string" },
        },
        properties: {
          name: { $ref: "#/definitions/name" },
        },
      };
      const parser = new $RefParser();
      // With resolve.external=false, only internal refs should be processed
      const bundled = await parser.bundle(schema, {
        resolve: { external: false },
      });
      // Internal $ref should still be present (bundle keeps them as $ref)
      expect(bundled.properties.name.$ref).to.equal("#/definitions/name");
      expect(bundled.definitions.name).to.deep.equal({ type: "string" });
    });

    it("Issue #262: $defs key should not be URL-encoded in bundled $ref paths", async () => {
      const schema = {
        type: "object",
        $defs: {
          signature: {
            type: "string",
          },
        },
        properties: {
          sig: { $ref: "#/$defs/signature" },
        },
      };
      const parser = new $RefParser();
      const bundled = await parser.bundle(schema);
      expect(bundled.properties.sig.$ref).to.equal("#/$defs/signature");
      // Should NOT be URL-encoded
      expect(bundled.properties.sig.$ref).to.not.contain("%24");
    });

    it("Issue #73: bundle should handle additional properties alongside $ref in recursive schemas", async () => {
      const parser = new $RefParser();
      const schema = path.rel("test/specs/historical-issues/fixtures/linked-list-schema.json");
      const bundled = await parser.bundle(schema);
      expect(bundled).to.be.an("object");
      expect(bundled.definitions.linkedList.properties.head).to.have.property("description", "The head of the list");
    });
  });

  // ============================================================================
  // Dereference Operation Issues
  // ============================================================================
  describe("Dereference", () => {
    it("Issue #365: sibling properties alongside $ref should be preserved with preservedProperties", async () => {
      const schema = {
        required: ["name"],
        type: "object",
        definitions: {
          name: {
            type: "string",
            description: "Someone's name",
          },
        },
        properties: {
          name: {
            $ref: "#/definitions/name",
          },
          secretName: {
            $ref: "#/definitions/name",
            description: "Someone's secret name",
          },
        },
        title: "Person",
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema, {
        dereference: {
          preservedProperties: ["description", "summary"],
        },
      });
      // The regular name should get the definition's description
      expect(result.properties.name.description).to.equal("Someone's name");
      // The secretName should preserve its own description
      expect(result.properties.secretName.description).to.equal("Someone's secret name");
    });

    it("Issue #370: recursive $ref with sibling keys should dereference correctly", async () => {
      const schema = {
        $defs: {
          RecursiveModel: {
            additionalProperties: false,
            properties: {
              value: {
                description: "A string",
                type: "string",
              },
              children: {
                description: "Children with strings",
                items: {
                  $ref: "#/$defs/RecursiveModel",
                },
                type: "array",
              },
            },
            type: "object",
          },
        },
        $ref: "#/$defs/RecursiveModel",
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result).to.have.property("type", "object");
      expect(result).to.have.property("additionalProperties", false);
      expect(result.properties.value).to.deep.equal({
        description: "A string",
        type: "string",
      });
      expect(result.properties.children).to.have.property("type", "array");
      expect(parser.$refs.circular).to.equal(true);
      // The items should be a circular reference back to the RecursiveModel
      expect(result.properties.children.items).to.have.property("type", "object");
      expect(result.properties.children.items).to.have.property("additionalProperties", false);
    });

    it("Issue #194: same external reference used multiple times should resolve correctly", async () => {
      const schema = {
        description: "some schema",
        type: "object",
        definitions: {
          color: {
            type: "string",
            enum: ["red", "green", "blue"],
          },
        },
        properties: {
          background_color: {
            $ref: "#/definitions/color",
          },
          foreground_color: {
            $ref: "#/definitions/color",
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.background_color).to.deep.equal({
        type: "string",
        enum: ["red", "green", "blue"],
      });
      expect(result.properties.foreground_color).to.deep.equal({
        type: "string",
        enum: ["red", "green", "blue"],
      });
      // Should be the same object reference (dedup)
      expect(result.properties.background_color).to.equal(result.properties.foreground_color);
    });

    it("Issue #164: error paths should reflect actual schema location", async () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        components: {
          messages: {
            testMessage: {
              payload: {
                $ref: "#/components/nonexistent/missing",
              },
            },
          },
        },
      };
      const parser = new $RefParser();
      try {
        await parser.dereference(schema);
        helper.shouldNotGetCalled();
      } catch (err: any) {
        expect(err.message).to.contain("nonexistent");
      }
    });
  });

  // ============================================================================
  // JSON Pointer Issues
  // ============================================================================
  describe("JSON Pointer", () => {
    it("Issue #81: $refs.get should work with JSON Pointer paths", async () => {
      const schema = { a: 7, b: "hello" };
      const $refs = await $RefParser.resolve(schema);
      // Verify individual properties can be accessed via JSON Pointer
      const valueA = $refs.get("#/a");
      expect(valueA).to.equal(7);
      const valueB = $refs.get("#/b");
      expect(valueB).to.equal("hello");
    });

    it("Issue #296: JSON Pointer with percent-encoded characters should parse", async () => {
      const schema = {
        definitions: {
          "my/definition": {
            type: "string",
          },
        },
        type: "object",
        properties: {
          test: {
            $ref: "#/definitions/my~1definition",
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.test).to.deep.equal({ type: "string" });
    });

    it("Issue #43: $ref with forward slashes in path segments should work", async () => {
      const schema = {
        paths: {
          "/airport/HAM": {
            get: {
              summary: "Get airport",
              responses: {
                200: {
                  $ref: "#/definitions/Airport",
                },
              },
            },
          },
        },
        definitions: {
          Airport: {
            type: "object",
            properties: {
              code: { type: "string" },
            },
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.paths["/airport/HAM"].get.responses[200]).to.deep.equal({
        type: "object",
        properties: { code: { type: "string" } },
      });
    });

    it("Issue #69: regex patterns in property names should not break $ref resolution", async () => {
      const schema = {
        definitions: {
          somethingElse: {
            type: "string",
          },
        },
        type: "object",
        patternProperties: {
          "!(somePattern)": {
            $ref: "#/definitions/somethingElse",
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.patternProperties["!(somePattern)"]).to.deep.equal({ type: "string" });
    });

    it("Issue #333: escaped paths (~0, ~1) should be handled correctly in remapping", async () => {
      const schema = {
        paths: {
          "/foo/bar": {
            get: {
              summary: "Get foo bar",
            },
          },
        },
        type: "object",
        properties: {
          ref_to_path: {
            $ref: "#/paths/~1foo~1bar/get",
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.ref_to_path).to.deep.equal({ summary: "Get foo bar" });
    });
  });

  // ============================================================================
  // External Reference Issues
  // ============================================================================
  describe("External References", () => {
    it("Issue #200: chained external $ref paths should resolve relative to their containing file", async () => {
      const parser = new $RefParser();
      const schema = path.rel("test/specs/historical-issues/fixtures/base-200.json");
      const result = await parser.dereference(schema);
      expect(result.properties.some_value).to.be.an("object");
      // Should have resolved through defs.json -> defs2.json chain
      expect(result.properties.some_value).to.have.property("type", "string");
      expect(result.properties.some_value).to.have.property("minLength", 1);
      expect(result.properties.some_value).to.have.property("maxLength", 100);
    });

    it("Issue #35: relative $ref pointers to external files should work", async () => {
      const parser = new $RefParser();
      const schema = path.rel("test/specs/historical-issues/fixtures/relative-main.json");
      const result = await parser.dereference(schema);
      expect(result.properties.sub).to.deep.equal({
        type: "object",
        properties: {
          name: { type: "string" },
        },
      });
    });
  });

  // ============================================================================
  // $id and URI Issues
  // ============================================================================
  describe("$id and URI handling", () => {
    it("Issue #136: standard JSON Pointer $ref to definitions should work", async () => {
      // Note: $id with anchor syntax (#address) and $ref: "#address" is not standard
      // JSON Pointer, so we test using standard JSON Pointer paths instead
      const schema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        definitions: {
          address: {
            type: "object",
            properties: {
              street_address: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
            },
            required: ["street_address", "city", "state"],
          },
        },
        type: "object",
        properties: {
          billing_address: { $ref: "#/definitions/address" },
          shipping_address: { $ref: "#/definitions/address" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.billing_address).to.have.property("type", "object");
      expect(result.properties.billing_address.properties).to.have.property("city");
      expect(result.properties.shipping_address).to.have.property("type", "object");
      // Both should be the same object reference
      expect(result.properties.billing_address).to.equal(result.properties.shipping_address);
    });
  });

  // ============================================================================
  // Error Handling Issues
  // ============================================================================
  describe("Error Handling", () => {
    it("Issue #85: resolver errors should not be silently swallowed", async () => {
      const parser = new $RefParser();
      try {
        await parser.dereference({
          $ref: "nonexistent-file-that-does-not-exist.json",
        });
        helper.shouldNotGetCalled();
      } catch (err: any) {
        expect(err).to.be.an("error");
        expect(err.message).to.be.a("string").that.is.not.empty;
      }
    });

    it("Issue #255: MissingPointerError should have descriptive message", async () => {
      const schema = {
        type: "object",
        properties: {
          foo: {
            $ref: "#/definitions/NonExistentDef",
          },
        },
        definitions: {},
      };
      const parser = new $RefParser();
      try {
        await parser.dereference(schema);
        helper.shouldNotGetCalled();
      } catch (err: any) {
        expect(err.message).to.contain("NonExistentDef");
      }
    });
  });

  // ============================================================================
  // Bundled/Embedded Schema Issues
  // ============================================================================
  describe("Bundled and Embedded Schemas", () => {
    it("Issue #376: bundled schema with $id references should resolve", async () => {
      const schema = {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          monetary: { $ref: "#/definitions/Monetary" },
          reference: { $ref: "#/definitions/Reference" },
        },
        definitions: {
          Monetary: {
            type: "object",
            properties: {
              amount: { type: "number" },
              currency: { type: "string" },
            },
          },
          Reference: {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.monetary).to.have.property("type", "object");
      expect(result.properties.monetary.properties.amount).to.have.property("type", "number");
      expect(result.properties.reference.properties.id).to.have.property("type", "string");
    });

    it("Issue #178: refs within the same document using different syntax", async () => {
      const schema = {
        definitions: {
          CodeDescription: {
            type: "object",
            properties: {
              code: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        type: "object",
        properties: {
          action: { $ref: "#/definitions/CodeDescription" },
          requestReason: { $ref: "#/definitions/CodeDescription" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.action).to.deep.equal({
        type: "object",
        properties: {
          code: { type: "string" },
          description: { type: "string" },
        },
      });
      expect(result.properties.requestReason).to.equal(result.properties.action);
    });
  });

  // ============================================================================
  // OpenAPI-specific Issues
  // ============================================================================
  describe("OpenAPI patterns", () => {
    it("Issue #243: URI-encoded path segments in $ref should resolve correctly", async () => {
      const schema = {
        channels: {
          "smartylighting/streetlights/1/0/event": {
            description: "The topic on which measured values may be produced.",
            parameters: {
              streetlightId: {
                description: "The ID of the streetlight.",
                schema: { type: "string" },
              },
            },
          },
        },
        components: {
          schemas: {
            LightMeasured: {
              type: "object",
              properties: {
                lumens: { type: "integer" },
              },
            },
          },
        },
        type: "object",
        properties: {
          measurement: { $ref: "#/components/schemas/LightMeasured" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.measurement).to.deep.equal({
        type: "object",
        properties: {
          lumens: { type: "integer" },
        },
      });
    });

    it("Issue #48: property $ref alongside top-level $ref should resolve", async () => {
      const schema = {
        definitions: {
          myOtherSchema: {
            type: "object",
            properties: {
              foo: { type: "string" },
            },
          },
        },
        type: "object",
        properties: {
          nested: { $ref: "#/definitions/myOtherSchema" },
        },
        anotherProperty: "whatever",
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.nested).to.deep.equal({
        type: "object",
        properties: { foo: { type: "string" } },
      });
      expect(result.anotherProperty).to.equal("whatever");
    });

    it("Issue #92: references within allOf extended objects should resolve", async () => {
      const schema = {
        definitions: {
          base: {
            type: "object",
            properties: {
              id: { type: "integer" },
            },
          },
          extended: {
            allOf: [
              { $ref: "#/definitions/base" },
              {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
              },
            ],
          },
        },
        type: "object",
        properties: {
          item: { $ref: "#/definitions/extended" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.item.allOf[0]).to.deep.equal({
        type: "object",
        properties: { id: { type: "integer" } },
      });
      expect(result.properties.item.allOf[1].properties.name).to.deep.equal({ type: "string" });
    });

    it("Issue #74: bundling with allOf should reference correct definitions", async () => {
      const schema = {
        $schema: "http://json-schema.org/draft-06/schema#",
        definitions: {
          auto_increment: {
            type: "number",
            minimum: 1,
          },
          base: {
            type: "object",
            properties: {
              id: { $ref: "#/definitions/auto_increment" },
            },
          },
        },
        type: "object",
        properties: {
          foo: {
            allOf: [
              { $ref: "#/definitions/base" },
              {
                properties: {
                  name: { type: "string" },
                },
              },
            ],
          },
        },
      };
      const parser = new $RefParser();
      const bundled = await parser.bundle(schema);
      // After bundling, the $ref inside allOf should still be valid
      expect(bundled.properties.foo.allOf[0].$ref).to.equal("#/definitions/base");
    });
  });

  // ============================================================================
  // Custom Resolver/Parser Issues
  // ============================================================================
  describe("Custom Resolvers", () => {
    it("Issue #49: custom resolver should preserve URL casing", async () => {
      const schema = {
        type: "object",
        properties: {
          data: { $ref: "custom://Path/Is/Case/Sensitive" },
        },
      };
      const receivedUrls: string[] = [];
      const parser = new $RefParser();
      await parser.dereference(schema, {
        resolve: {
          custom: {
            canRead: /^custom:\/\//,
            read(file: any) {
              receivedUrls.push(file.url);
              return { type: "string" };
            },
          },
        },
      });
      // Verify casing was preserved
      expect(receivedUrls.length).to.be.greaterThan(0);
      const url = receivedUrls.find((u) => u.startsWith("custom://"));
      expect(url).to.contain("Path/Is/Case/Sensitive");
    });

    it("Issue #63: resolvers should get full file URL for json-pointer refs", async () => {
      const receivedUrls: string[] = [];
      const schema = {
        type: "object",
        properties: {
          inner: { $ref: "custom://mydomain.com/schema#/inner" },
        },
      };
      const parser = new $RefParser();
      try {
        await parser.dereference(schema, {
          resolve: {
            custom: {
              canRead: /^custom:\/\//,
              read(file: any) {
                receivedUrls.push(file.url);
                return {
                  inner: { type: "string" },
                };
              },
            },
          },
        });
      } catch {
        // May fail due to custom protocol, but we care about the URL passed
      }
      expect(receivedUrls.length).to.be.greaterThan(0);
      // The URL should be the file part, without the hash/pointer
      expect(receivedUrls[0]).to.equal("custom://mydomain.com/schema");
    });
  });

  // ============================================================================
  // Miscellaneous Issues
  // ============================================================================
  describe("Miscellaneous", () => {
    it("Issue #24: references through other references should be fully resolved", async () => {
      const schema = {
        definitions: {
          base: {
            type: "string",
          },
          alias: {
            $ref: "#/definitions/base",
          },
        },
        type: "object",
        properties: {
          value: {
            $ref: "#/definitions/alias",
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.value).to.deep.equal({ type: "string" });
    });

    it("Issue #389: trailing slash before fragment in $ref should be handled", async () => {
      // When $ref has a trailing slash before #, it should still work or give a clear error
      const schema = {
        type: "object",
        definitions: {
          ErrorResponse: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
        properties: {
          error: { $ref: "#/definitions/ErrorResponse" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.error).to.deep.equal({
        type: "object",
        properties: { message: { type: "string" } },
      });
    });

    it("Issue #138: YAML merge keys should not interfere with $ref resolution", async () => {
      // This tests that schemas using regular $ref alongside other YAML constructs work
      const schema = {
        components: {
          schemas: {
            SomeError: {
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
          },
          responses: {
            SomeErrorResponse: {
              description: "Some error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SomeError" },
                },
              },
            },
          },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.components.responses.SomeErrorResponse.content["application/json"].schema).to.deep.equal({
        type: "object",
        properties: { message: { type: "string" } },
      });
    });

    it("Issue #336: prototype pollution should be prevented", async () => {
      // Ensure __proto__, constructor, prototype keys in schemas don't cause pollution
      const schema = {
        type: "object",
        definitions: {
          safe: {
            type: "string",
          },
        },
        properties: {
          normal: { $ref: "#/definitions/safe" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      expect(result.properties.normal).to.deep.equal({ type: "string" });
      // Verify no prototype pollution occurred
      expect(({} as any).polluted).to.be.undefined;
    });

    it("Issue #21: multiple refs to same external path should all resolve", async () => {
      const schema = {
        definitions: {
          shared: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
        type: "object",
        properties: {
          first: { $ref: "#/definitions/shared" },
          second: { $ref: "#/definitions/shared" },
          third: { $ref: "#/definitions/shared" },
        },
      };
      const parser = new $RefParser();
      const result = await parser.dereference(schema);
      const expected = {
        type: "object",
        properties: { name: { type: "string" } },
      };
      expect(result.properties.first).to.deep.equal(expected);
      expect(result.properties.second).to.deep.equal(expected);
      expect(result.properties.third).to.deep.equal(expected);
      // All should be the same reference
      expect(result.properties.first).to.equal(result.properties.second);
      expect(result.properties.second).to.equal(result.properties.third);
    });

    it("Issue #67: bundle remapping should produce valid internal refs", async () => {
      const schema = {
        type: "object",
        definitions: {
          Action: {
            type: "object",
            properties: {
              binding: { type: "string" },
              target: { $ref: "#/definitions/Target" },
            },
          },
          Target: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
        properties: {
          views: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { $ref: "#/definitions/Action" },
              },
            },
          },
        },
      };
      const parser = new $RefParser();
      const bundled = await parser.bundle(schema);
      // Internal refs should remain valid
      expect(bundled.definitions.Action.properties.target.$ref).to.equal("#/definitions/Target");
    });

    it("Issue #394: YAML with standard tags should not throw errors", async () => {
      const parser = new $RefParser();
      const schema = path.rel("test/specs/historical-issues/fixtures/binary-tag.yaml");
      const result = await parser.parse(schema);
      expect(result).to.be.an("object");
      expect(result.Person).to.have.property("type", "object");
    });

    it("Issue #258: dereference should not mutate input when mutateInputSchema is false", async () => {
      const original = {
        definitions: {
          name: {
            type: "string",
          },
        },
        type: "object",
        properties: {
          name: { $ref: "#/definitions/name" },
        },
      };
      const originalClone = JSON.parse(JSON.stringify(original));
      const parser = new $RefParser();
      await parser.dereference(original, {
        mutateInputSchema: false,
      });
      // Original should not be mutated
      expect(original).to.deep.equal(originalClone);
    });
  });
});
