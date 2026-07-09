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
    await expect(parser.dereference(schema, { dereference: { maxDepth: 5 } })).rejects.toThrow(RangeError);

    // Should succeed with a higher max depth
    const parser2 = new $RefParser();
    const result = await parser2.dereference(schema, { dereference: { maxDepth: 50 } });
    expect(result).toBeDefined();
    expect(result.type).toBe("object");
  });

  it("should apply max depth to reference chains", async () => {
    const parser = new $RefParser();
    await parser.resolve(createReferenceChain(1_001));

    expect(() => parser.$refs.get("#/entry")).to.throw(/Maximum dereference depth \(500\)/);
    expect(() =>
      parser.$refs.get("#/entry", {
        dereference: { maxDepth: 1_000 },
      }),
    ).to.throw(/Maximum dereference depth \(1000\)/);

    expect(
      parser.$refs.get("#/entry", {
        dereference: { maxDepth: 6_000 },
      }),
    ).to.deep.equal({ type: "string" });

    const dereferenced = await new $RefParser().dereference(createReferenceChain(600), {
      dereference: { maxDepth: 1_000 },
    });
    expect(dereferenced.entry).to.deep.equal({ type: "string" });
  }, 20_000);

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

function createReferenceChain(length: number) {
  const definitions: Record<string, { $ref: string } | { type: string }> = {};
  for (let index = 0; index < length; index++) {
    definitions[`node${index}`] =
      index === length - 1 ? { type: "string" } : { $ref: `#/definitions/node${index + 1}` };
  }

  return {
    definitions,
    entry: { $ref: "#/definitions/node0" },
  };
}
