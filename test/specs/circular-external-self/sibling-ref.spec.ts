import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("Issue #370: $ref with sibling keys and recursive model", () => {
  it("should dereference when $ref is wrapped in allOf (old Pydantic format)", async () => {
    const schema = await $RefParser.dereference({
      $defs: {
        RecursiveModel: {
          additionalProperties: false,
          properties: {
            value: { description: "A string", type: "string" },
            children: {
              description: "Children with strings",
              items: { $ref: "#/$defs/RecursiveModel" },
              type: "array",
            },
          },
          required: ["value", "children"],
          title: "RecursiveModel",
          type: "object",
        },
      },
      allOf: [{ $ref: "#/$defs/RecursiveModel" }],
    });

    // The children.items should be a circular reference to the RecursiveModel
    const properties = schema.$defs.RecursiveModel.properties;
    expect(properties.children.items).toBeDefined();
    expect(properties.children.items.title).toBe("RecursiveModel");
    // Should not contain unresolved $ref
    expect(properties.children.items.$ref).toBeUndefined();
  });

  it("should dereference when $ref is a sibling alongside $defs (new Pydantic format)", async () => {
    const schema = await $RefParser.dereference({
      $defs: {
        RecursiveModel: {
          additionalProperties: false,
          properties: {
            value: { description: "A string", type: "string" },
            children: {
              description: "Children with strings",
              items: { $ref: "#/$defs/RecursiveModel" },
              type: "array",
            },
          },
          required: ["value", "children"],
          title: "RecursiveModel",
          type: "object",
        },
      },
      $ref: "#/$defs/RecursiveModel",
    });

    // The $defs.RecursiveModel should exist and be properly dereferenced
    expect(schema.$defs).toBeDefined();
    expect(schema.$defs.RecursiveModel).toBeDefined();

    const properties = schema.$defs.RecursiveModel.properties;
    expect(properties.children.items).toBeDefined();
    expect(properties.children.items.title).toBe("RecursiveModel");
    // Should NOT contain unresolved $ref with %24defs encoding
    expect(properties.children.items.$ref).toBeUndefined();
  });
});
