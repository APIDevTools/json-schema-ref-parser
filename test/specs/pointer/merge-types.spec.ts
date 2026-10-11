import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("extended reference merging", () => {
  it("replaces an array with an object-valued sibling", async () => {
    const schema = {
      definitions: {
        tuple: { type: "array", items: [{ type: "string" }, { type: "number" }] },
      },
      value: { $ref: "#/definitions/tuple", items: { type: "boolean" } },
    };

    const result = await $RefParser.dereference(schema);

    expect(result.value.items).toEqual({ type: "boolean" });
    expect(Array.isArray(result.value.items)).toBe(false);
    expect(result.definitions.tuple.items).toEqual([{ type: "string" }, { type: "number" }]);
  });

  it("replaces arrays at nested object keys with object-valued siblings", async () => {
    const schema = {
      definitions: {
        target: {
          properties: {
            list: { type: "array", items: [{ type: "string" }, { type: "number" }] },
          },
        },
      },
      value: {
        $ref: "#/definitions/target",
        properties: { list: { items: { type: "boolean" } } },
      },
    };

    const result = await $RefParser.dereference(schema);

    expect(result.value.properties.list).toEqual({ type: "array", items: { type: "boolean" } });
    expect(result.definitions.target.properties.list.items).toHaveLength(2);
  });
});
