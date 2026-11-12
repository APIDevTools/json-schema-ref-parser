import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("Bundle with $id in sub-schemas and no root $id", () => {
  it("should point repeat refs from the document root instead of the root's file path", async () => {
    const parser = new $RefParser();
    const bundled = await parser.bundle(path.rel("test/specs/bundle-id-refs-no-root-id/root.schema.json"));
    const search = bundled.properties.search;

    // With no root $id there is no portable URI to point back to, so the nested $id is removed
    // and refs beneath it become plain pointers from the document root.
    expect(search).not.toHaveProperty("$id");
    expect(search.properties.test2.$ref).toBe("#/properties/search/properties/test1");
    expect(search.properties.page.$ref).toBe("#/properties/search/$defs/page");
    expect(JSON.stringify(bundled)).not.toContain(path.abs("test/specs"));

    // The bundle resolves on its own, without the source files.
    const dereferenced = await $RefParser.dereference(structuredClone(bundled));
    expect(dereferenced.properties.search.properties.test2).toEqual({
      type: "object",
      properties: { name: { type: "string" } },
    });
    expect(dereferenced.properties.search.properties.page).toEqual({ type: "integer" });
  });

  it("should keep the nested $id when a URI ref beneath it relies on it", async () => {
    const parser = new $RefParser();
    const bundled = await parser.bundle(path.rel("test/specs/bundle-id-refs-no-root-id/uri-ref.schema.json"));
    const search = bundled.properties.search;

    expect(search.$id).toBe("requests/search-uri.schema.json");
    expect(search.properties.page.$ref).toBe("search-uri.schema.json#/$defs/page");
  });
});
