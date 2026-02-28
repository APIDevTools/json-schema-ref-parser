import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("dereference.cloneReferences (issue #349)", () => {
  it("should share references by default", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/dereference-clone-references/schema.json"));

    // By default, both properties should point to the same object
    expect(schema.properties.first).toBe(schema.properties.second);

    // Modifying one affects the other
    schema.properties.first["x-custom"] = "test";
    expect(schema.properties.second["x-custom"]).toBe("test");
  });

  it("should clone references when cloneReferences is true", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/dereference-clone-references/schema.json"), {
      dereference: { cloneReferences: true },
    });

    // With cloneReferences, they should be equal but not the same object
    expect(schema.properties.first).toEqual(schema.properties.second);
    expect(schema.properties.first).not.toBe(schema.properties.second);

    // Modifying one should NOT affect the other
    schema.properties.first["x-custom"] = "test";
    expect(schema.properties.second["x-custom"]).toBeUndefined();
  });

  it("should preserve circular references even with cloneReferences", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/circular-oneof/schema.json"), {
      dereference: { cloneReferences: true },
    });

    expect(parser.$refs.circular).toBe(true);
    // Circular references should still use the same reference (not cloned)
    const nestedItem = schema.items.oneOf[1];
    expect(nestedItem.properties.entries).toBe(schema);
  });
});
