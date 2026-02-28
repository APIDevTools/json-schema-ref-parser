import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("OpenAPI 3.0 schema patterns", () => {
  describe("components/schemas with $ref composition", () => {
    const schema = {
      openapi: "3.0.0",
      info: { title: "Pet Store", version: "1.0.0" },
      paths: {
        "/pets": {
          get: {
            responses: {
              "200": {
                description: "A list of pets",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Pet" },
                    },
                  },
                },
              },
            },
          },
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/NewPet" },
                },
              },
            },
            responses: {
              "201": {
                description: "Pet created",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Pet" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Pet: {
            allOf: [
              { $ref: "#/components/schemas/NewPet" },
              {
                type: "object",
                required: ["id"],
                properties: {
                  id: { type: "integer", format: "int64" },
                },
              },
            ],
          },
          NewPet: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              tag: { type: "string" },
            },
          },
        },
      },
    };

    it("should dereference allOf composition in components/schemas", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect(result).to.equal(parser.schema);

      // Pet's allOf[0] should be dereferenced to the NewPet schema
      const pet = (result as any).components.schemas.Pet;
      expect(pet.allOf[0]).to.deep.equal({
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          tag: { type: "string" },
        },
      });

      // References from paths should resolve to same objects
      const itemsSchema = (result as any).paths["/pets"].get.responses["200"].content["application/json"].schema.items;
      expect(itemsSchema).to.equal((result as any).components.schemas.Pet);

      expect(parser.$refs.circular).to.equal(false);
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const result = await parser.bundle(structuredClone(schema));
      expect(result).to.equal(parser.schema);
      // After bundling, all $refs should still be internal
      const itemsRef = (result as any).paths["/pets"].get.responses["200"].content["application/json"].schema.items;
      expect(itemsRef.$ref).to.equal("#/components/schemas/Pet");
    });
  });

  describe("oneOf discriminator pattern", () => {
    const schema = {
      type: "object",
      properties: {
        shape: {
          oneOf: [
            { $ref: "#/definitions/Circle" },
            { $ref: "#/definitions/Rectangle" },
            { $ref: "#/definitions/Triangle" },
          ],
          discriminator: {
            propertyName: "shapeType",
          },
        },
      },
      definitions: {
        Shape: {
          type: "object",
          required: ["shapeType"],
          properties: {
            shapeType: { type: "string" },
            color: { type: "string" },
          },
        },
        Circle: {
          allOf: [
            { $ref: "#/definitions/Shape" },
            {
              type: "object",
              properties: {
                radius: { type: "number" },
              },
            },
          ],
        },
        Rectangle: {
          allOf: [
            { $ref: "#/definitions/Shape" },
            {
              type: "object",
              properties: {
                width: { type: "number" },
                height: { type: "number" },
              },
            },
          ],
        },
        Triangle: {
          allOf: [
            { $ref: "#/definitions/Shape" },
            {
              type: "object",
              properties: {
                base: { type: "number" },
                height: { type: "number" },
              },
            },
          ],
        },
      },
    };

    it("should dereference oneOf with shared base type via allOf", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const circle = (result as any).definitions.Circle;
      const rectangle = (result as any).definitions.Rectangle;
      const triangle = (result as any).definitions.Triangle;

      // All three shapes should share the same dereferenced Shape base
      expect(circle.allOf[0]).to.equal(rectangle.allOf[0]);
      expect(circle.allOf[0]).to.equal(triangle.allOf[0]);

      // The base should be the Shape schema
      expect(circle.allOf[0]).to.deep.equal({
        type: "object",
        required: ["shapeType"],
        properties: {
          shapeType: { type: "string" },
          color: { type: "string" },
        },
      });

      // oneOf items should be dereferenced
      const shapeOneOf = (result as any).properties.shape.oneOf;
      expect(shapeOneOf[0]).to.equal((result as any).definitions.Circle);
      expect(shapeOneOf[1]).to.equal((result as any).definitions.Rectangle);
      expect(shapeOneOf[2]).to.equal((result as any).definitions.Triangle);
    });
  });

  describe("anyOf with nullable pattern", () => {
    const schema = {
      type: "object",
      properties: {
        owner: {
          anyOf: [
            { $ref: "#/definitions/Person" },
            { type: "null" },
          ],
        },
        address: {
          anyOf: [
            { $ref: "#/definitions/Address" },
            { type: "null" },
          ],
        },
      },
      definitions: {
        Person: {
          type: "object",
          properties: {
            name: { type: "string" },
            address: {
              anyOf: [
                { $ref: "#/definitions/Address" },
                { type: "null" },
              ],
            },
          },
        },
        Address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
          },
        },
      },
    };

    it("should dereference anyOf with nullable pattern", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      // Address should be shared across all references
      const ownerAddress = (result as any).properties.owner.anyOf[0];
      expect(ownerAddress).to.equal((result as any).definitions.Person);

      const personAddress = (result as any).definitions.Person.properties.address.anyOf[0];
      const topAddress = (result as any).properties.address.anyOf[0];
      expect(personAddress).to.equal(topAddress);
      expect(personAddress).to.equal((result as any).definitions.Address);
    });
  });

  describe("deeply nested component references (OpenAPI response/error pattern)", () => {
    const schema = {
      components: {
        schemas: {
          Error: {
            type: "object",
            properties: {
              code: { type: "integer" },
              message: { type: "string" },
              details: {
                type: "array",
                items: { $ref: "#/components/schemas/ErrorDetail" },
              },
            },
          },
          ErrorDetail: {
            type: "object",
            properties: {
              field: { type: "string" },
              reason: { type: "string" },
            },
          },
          PaginatedResponse: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: { $ref: "#/components/schemas/User" },
              },
              pagination: { $ref: "#/components/schemas/Pagination" },
              error: { $ref: "#/components/schemas/Error" },
            },
          },
          User: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              profile: { $ref: "#/components/schemas/UserProfile" },
            },
          },
          UserProfile: {
            type: "object",
            properties: {
              displayName: { type: "string" },
              avatar: { type: "string", format: "uri" },
            },
          },
          Pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              perPage: { type: "integer" },
              total: { type: "integer" },
            },
          },
        },
      },
    };

    it("should dereference multi-level nested refs", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const paginated = (result as any).components.schemas.PaginatedResponse;
      // data.items should resolve to User
      expect(paginated.properties.data.items).to.equal((result as any).components.schemas.User);
      // pagination should resolve to Pagination
      expect(paginated.properties.pagination).to.equal((result as any).components.schemas.Pagination);
      // error should resolve to Error
      expect(paginated.properties.error).to.equal((result as any).components.schemas.Error);
      // User.profile should resolve to UserProfile
      expect((result as any).components.schemas.User.properties.profile).to.equal(
        (result as any).components.schemas.UserProfile,
      );
      // Error.details.items should resolve to ErrorDetail
      expect((result as any).components.schemas.Error.properties.details.items).to.equal(
        (result as any).components.schemas.ErrorDetail,
      );

      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("$ref with sibling properties (OpenAPI extended $ref)", () => {
    const schema = {
      type: "object",
      properties: {
        pet: {
          $ref: "#/definitions/Pet",
          description: "The user's pet",
          "x-custom": "custom-value",
        },
      },
      definitions: {
        Pet: {
          type: "object",
          properties: {
            name: { type: "string" },
            species: { type: "string" },
          },
        },
      },
    };

    it("should merge sibling properties with dereferenced value", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const pet = (result as any).properties.pet;
      // Should have the original properties from the $ref target
      expect(pet.type).to.equal("object");
      expect(pet.properties.name).to.deep.equal({ type: "string" });
      // Should also have the sibling properties
      expect(pet.description).to.equal("The user's pet");
      expect(pet["x-custom"]).to.equal("custom-value");
    });
  });
});
