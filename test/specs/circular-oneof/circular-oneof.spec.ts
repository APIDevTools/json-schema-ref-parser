import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("Circular $ref in oneOf (issue #403)", () => {
  it("should detect circular $ref: '#' inside oneOf and not expand infinitely", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/circular-oneof/schema.json"));

    expect(parser.$refs.circular).toBe(true);

    // The entries property should point back to the root schema (circular reference)
    const nestedItem = schema.items.oneOf[1];
    expect(nestedItem.properties.entries).toBe(schema);
  });

  it("should work with dereference.circular = 'ignore'", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/circular-oneof/schema.json"), {
      dereference: { circular: "ignore" },
    });

    expect(parser.$refs.circular).toBe(true);

    // With circular: "ignore", the $ref should remain unresolved
    const nestedItem = schema.items.oneOf[1];
    expect(nestedItem.properties.entries).toHaveProperty("$ref");
  });

  it("should detect circular with onCircular callback", async () => {
    const circularPaths: string[] = [];
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/circular-oneof/schema.json"), {
      dereference: {
        onCircular: (path) => circularPaths.push(path),
      },
    });

    expect(parser.$refs.circular).toBe(true);
    expect(circularPaths.length).toBeGreaterThan(0);
  });
});
