import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("Dereference max depth", () => {
  it("should throw RangeError when max depth is exceeded", async () => {
    // Build a deeply nested schema that exceeds the default max depth
    let schema: any = { type: "string" };
    for (let i = 0; i < 600; i++) {
      schema = {
        type: "object",
        properties: {
          nested: schema,
        },
      };
    }

    const parser = new $RefParser();
    await expect(parser.dereference(schema)).rejects.toThrow(RangeError);
    await expect(parser.dereference(schema)).rejects.toThrow(/Maximum dereference depth/);
  });

  it("should allow configuring max depth", async () => {
    // Build a schema that's 20 levels deep
    let schema: any = { type: "string" };
    for (let i = 0; i < 20; i++) {
      schema = {
        type: "object",
        properties: {
          nested: schema,
        },
      };
    }

    const parser = new $RefParser();

    // Should fail with a low max depth
    await expect(
      parser.dereference(schema, { dereference: { maxDepth: 5 } }),
    ).rejects.toThrow(RangeError);

    // Should succeed with a higher max depth
    const parser2 = new $RefParser();
    const result = await parser2.dereference(schema, { dereference: { maxDepth: 50 } });
    expect(result).toBeDefined();
    expect(result.type).toBe("object");
  });

  it("should dereference normally when within max depth", async () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };

    const parser = new $RefParser();
    const result = await parser.dereference(schema);
    expect(result.type).toBe("object");
    expect(result.properties.name.type).toBe("string");
  });
});
