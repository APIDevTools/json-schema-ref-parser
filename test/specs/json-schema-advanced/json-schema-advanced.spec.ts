import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("JSON Schema Draft 7 advanced features", () => {
  describe("if/then/else with $ref", () => {
    const schema = {
      type: "object",
      properties: {
        type: { type: "string", enum: ["residential", "commercial"] },
      },
      if: {
        properties: {
          type: { const: "residential" },
        },
      },
      then: { $ref: "#/definitions/ResidentialAddress" },
      else: { $ref: "#/definitions/CommercialAddress" },
      definitions: {
        ResidentialAddress: {
          type: "object",
          properties: {
            street: { type: "string" },
            unit: { type: "string" },
            city: { type: "string" },
          },
          required: ["street", "city"],
        },
        CommercialAddress: {
          type: "object",
          properties: {
            street: { type: "string" },
            suite: { type: "string" },
            floor: { type: "integer" },
            city: { type: "string" },
            companyName: { type: "string" },
          },
          required: ["street", "city", "companyName"],
        },
      },
    };

    it("should dereference if/then/else $refs", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      expect((result as any).then).to.equal((result as any).definitions.ResidentialAddress);
      expect((result as any).else).to.equal((result as any).definitions.CommercialAddress);
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should bundle if/then/else $refs", async () => {
      const parser = new $RefParser();
      const result = await parser.bundle(structuredClone(schema));
      expect((result as any).then.$ref).to.equal("#/definitions/ResidentialAddress");
      expect((result as any).else.$ref).to.equal("#/definitions/CommercialAddress");
    });
  });

  describe("$defs (Draft 2019-09+)", () => {
    const schema = {
      $schema: "https://json-schema.org/draft/2019-09/schema",
      type: "object",
      properties: {
        name: { $ref: "#/$defs/Name" },
        email: { $ref: "#/$defs/Email" },
        role: { $ref: "#/$defs/Role" },
      },
      $defs: {
        Name: {
          type: "object",
          properties: {
            first: { $ref: "#/$defs/NonEmptyString" },
            last: { $ref: "#/$defs/NonEmptyString" },
          },
        },
        Email: {
          type: "string",
          format: "email",
        },
        Role: {
          type: "string",
          enum: ["admin", "user", "guest"],
        },
        NonEmptyString: {
          type: "string",
          minLength: 1,
        },
      },
    };

    it("should dereference $defs with nested references", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      // Top-level properties should resolve
      expect((result as any).properties.name).to.equal((result as any).$defs.Name);
      expect((result as any).properties.email).to.equal((result as any).$defs.Email);
      expect((result as any).properties.role).to.equal((result as any).$defs.Role);

      // Nested refs within $defs should resolve
      const name = (result as any).$defs.Name;
      expect(name.properties.first).to.equal((result as any).$defs.NonEmptyString);
      expect(name.properties.last).to.equal((result as any).$defs.NonEmptyString);
      expect(name.properties.first).to.deep.equal({ type: "string", minLength: 1 });
    });
  });

  describe("patternProperties with $ref", () => {
    const schema = {
      type: "object",
      patternProperties: {
        "^x-": { $ref: "#/definitions/Extension" },
        "^[a-z]+$": { $ref: "#/definitions/Field" },
      },
      additionalProperties: { $ref: "#/definitions/AnyValue" },
      definitions: {
        Extension: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: {},
          },
        },
        Field: {
          type: "object",
          properties: {
            type: { type: "string" },
            required: { type: "boolean" },
          },
        },
        AnyValue: {
          oneOf: [
            { type: "string" },
            { type: "number" },
            { type: "boolean" },
            { type: "object" },
            { type: "array" },
            { type: "null" },
          ],
        },
      },
    };

    it("should dereference $refs in patternProperties", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      expect((result as any).patternProperties["^x-"]).to.equal((result as any).definitions.Extension);
      expect((result as any).patternProperties["^[a-z]+$"]).to.equal((result as any).definitions.Field);
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should dereference $ref in additionalProperties", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      expect((result as any).additionalProperties).to.equal((result as any).definitions.AnyValue);
    });
  });

  describe("dependencies with $ref", () => {
    const schema = {
      type: "object",
      properties: {
        creditCard: { type: "string" },
        billingAddress: { $ref: "#/definitions/Address" },
      },
      dependencies: {
        creditCard: { $ref: "#/definitions/BillingRequired" },
      },
      definitions: {
        Address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            zip: { type: "string" },
          },
        },
        BillingRequired: {
          required: ["billingAddress"],
          properties: {
            billingAddress: { $ref: "#/definitions/Address" },
          },
        },
      },
    };

    it("should dereference $refs in dependencies", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      expect((result as any).dependencies.creditCard).to.equal(
        (result as any).definitions.BillingRequired,
      );
      // billingAddress refs should share the same object
      expect((result as any).properties.billingAddress).to.equal((result as any).definitions.Address);
    });
  });

  describe("items as array (tuple validation) with $ref", () => {
    const schema = {
      type: "object",
      properties: {
        coordinates: {
          type: "array",
          items: [
            { $ref: "#/definitions/Latitude" },
            { $ref: "#/definitions/Longitude" },
            { $ref: "#/definitions/Altitude" },
          ],
          additionalItems: false,
        },
      },
      definitions: {
        Latitude: {
          type: "number",
          minimum: -90,
          maximum: 90,
        },
        Longitude: {
          type: "number",
          minimum: -180,
          maximum: 180,
        },
        Altitude: {
          type: "number",
          minimum: 0,
        },
      },
    };

    it("should dereference tuple items with $refs", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const items = (result as any).properties.coordinates.items;
      expect(items[0]).to.equal((result as any).definitions.Latitude);
      expect(items[1]).to.equal((result as any).definitions.Longitude);
      expect(items[2]).to.equal((result as any).definitions.Altitude);
      expect(items[0]).to.deep.equal({ type: "number", minimum: -90, maximum: 90 });
    });
  });

  describe("deeply nested $ref indirection", () => {
    it("should resolve $refs that point through intermediate definitions", async () => {
      const schema = {
        type: "object",
        properties: {
          value: { $ref: "#/definitions/Alias" },
        },
        definitions: {
          Alias: {
            allOf: [{ $ref: "#/definitions/Base" }],
          },
          Base: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      // The Alias wraps Base via allOf
      expect((result as any).definitions.Alias.allOf[0]).to.equal((result as any).definitions.Base);
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should handle $ref pointing to a property of another definition", async () => {
      const schema = {
        type: "object",
        properties: {
          firstName: { $ref: "#/definitions/Person/properties/name/properties/first" },
        },
        definitions: {
          Person: {
            type: "object",
            properties: {
              name: {
                type: "object",
                properties: {
                  first: { type: "string", minLength: 1 },
                  last: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      expect((result as any).properties.firstName).to.deep.equal({
        type: "string",
        minLength: 1,
      });
    });

    it("should bundle multi-level refs correctly", async () => {
      const schema = {
        type: "object",
        properties: {
          value: { $ref: "#/definitions/Wrapper" },
        },
        definitions: {
          Wrapper: {
            type: "object",
            properties: {
              inner: { $ref: "#/definitions/Inner" },
            },
          },
          Inner: {
            type: "object",
            properties: {
              deep: { $ref: "#/definitions/Deep" },
            },
          },
          Deep: {
            type: "string",
            format: "uri",
          },
        },
      };

      const parser = new $RefParser();
      const result = await parser.bundle(structuredClone(schema));
      expect(Object.keys((result as any).definitions)).to.have.lengthOf(3);
    });
  });

  describe("const and enum values with $ref siblings", () => {
    const schema = {
      type: "object",
      properties: {
        status: {
          allOf: [
            { $ref: "#/definitions/StatusEnum" },
            { description: "The current status" },
          ],
        },
        priority: {
          allOf: [
            { $ref: "#/definitions/PriorityConst" },
            { default: "medium" },
          ],
        },
      },
      definitions: {
        StatusEnum: {
          type: "string",
          enum: ["active", "inactive", "pending"],
        },
        PriorityConst: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
      },
    };

    it("should dereference allOf with $ref and non-$ref items", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const statusAllOf = (result as any).properties.status.allOf;
      expect(statusAllOf[0]).to.equal((result as any).definitions.StatusEnum);
      expect(statusAllOf[1]).to.deep.equal({ description: "The current status" });

      const priorityAllOf = (result as any).properties.priority.allOf;
      expect(priorityAllOf[0]).to.equal((result as any).definitions.PriorityConst);
      expect(priorityAllOf[1]).to.deep.equal({ default: "medium" });
    });
  });

  describe("nested $defs at different schema levels", () => {
    const schema = {
      type: "object",
      properties: {
        config: {
          type: "object",
          properties: {
            database: { $ref: "#/properties/config/$defs/DatabaseConfig" },
            cache: { $ref: "#/properties/config/$defs/CacheConfig" },
          },
          $defs: {
            DatabaseConfig: {
              type: "object",
              properties: {
                host: { type: "string" },
                port: { type: "integer" },
                name: { type: "string" },
              },
            },
            CacheConfig: {
              type: "object",
              properties: {
                ttl: { type: "integer" },
                maxSize: { type: "integer" },
              },
            },
          },
        },
      },
    };

    it("should dereference $refs pointing to nested $defs", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const config = (result as any).properties.config;
      expect(config.properties.database).to.equal(config.$defs.DatabaseConfig);
      expect(config.properties.cache).to.equal(config.$defs.CacheConfig);
      expect(config.properties.database.properties.host).to.deep.equal({ type: "string" });
    });
  });

  describe("propertyNames with $ref", () => {
    const schema = {
      type: "object",
      propertyNames: { $ref: "#/definitions/ValidKey" },
      definitions: {
        ValidKey: {
          type: "string",
          pattern: "^[a-zA-Z_][a-zA-Z0-9_]*$",
          maxLength: 64,
        },
      },
    };

    it("should dereference propertyNames $ref", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      expect((result as any).propertyNames).to.equal((result as any).definitions.ValidKey);
      expect((result as any).propertyNames).to.deep.equal({
        type: "string",
        pattern: "^[a-zA-Z_][a-zA-Z0-9_]*$",
        maxLength: 64,
      });
    });
  });
});
