import { describe, expect, it } from "vitest";
import $RefParser from "../../lib/index.js";

describe("URL resolution regressions", () => {
  it.each(["a#b#c", "a\\b"])("resolves HTTP schema references to the property %s", async (key) => {
    const target = { type: "string" };
    const schema = {
      definitions: { [key]: target },
      properties: { value: { $ref: `#/definitions/${key}` } },
    };

    const result = await $RefParser.dereference("https://example.com/schema.json", schema, {});

    expect(result.properties.value).toBe(target);
  });
});
