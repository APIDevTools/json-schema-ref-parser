import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("externalReferenceResolution option (issue #384)", () => {
  it("should resolve relative $ref paths relative to the schema file by default", async () => {
    const parser = new $RefParser();
    const schema = path.rel("test/specs/external-reference-resolution/schemas/main.json");
    const result = await parser.dereference(schema);

    expect(result.properties.address).toEqual({
      type: "object",
      properties: {
        street: { type: "string" },
        city: { type: "string" },
      },
    });
  });

  it('should resolve relative $ref paths relative to schema file with externalReferenceResolution: "relative"', async () => {
    const parser = new $RefParser();
    const schema = path.rel("test/specs/external-reference-resolution/schemas/main.json");
    const result = await parser.dereference(schema, {
      dereference: { externalReferenceResolution: "relative" },
    });

    expect(result.properties.address).toEqual({
      type: "object",
      properties: {
        street: { type: "string" },
        city: { type: "string" },
      },
    });
  });
});
