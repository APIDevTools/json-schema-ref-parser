import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

const fixture = (file: string) => path.rel(`test/specs/bundle-id-refs-no-root-id/${file}`);

/** Bundles a fixture and checks the bundle carries no local file paths and dereferences on its own. */
async function bundlePortably(file: string) {
  const bundled = await new $RefParser().bundle(fixture(file));
  expect(JSON.stringify(bundled)).not.toContain(path.abs("test/specs"));

  const dereferenced = await $RefParser.dereference(structuredClone(bundled));
  return { bundled, dereferenced };
}

const testSchema = { type: "object", properties: { name: { type: "string" } } };

describe("Bundle with $id in sub-schemas and no root $id", () => {
  it("should point repeat refs from the nested resource instead of the root's file path", async () => {
    const { bundled, dereferenced } = await bundlePortably("root.schema.json");
    const search = bundled.properties.search;

    expect(search.$id).toBe("requests/search.schema.json");
    expect(search.properties.test2.$ref).toBe("#/properties/test1");
    expect(search.properties.page.$ref).toBe("#/$defs/page");
    expect(dereferenced.properties.search.properties.test2).toEqual(testSchema);
    expect(dereferenced.properties.search.properties.page).toEqual({ type: "integer" });
  });

  it("should keep a URI ref to the nested resource as written", async () => {
    const { bundled, dereferenced } = await bundlePortably("uri-ref.schema.json");
    const search = bundled.properties.search;

    expect(search.$id).toBe("requests/search-uri.schema.json");
    expect(search.properties.test2.$ref).toBe("#/properties/test1");
    expect(search.properties.page.$ref).toBe("search-uri.schema.json#/$defs/page");
    expect(dereferenced.properties.search.properties.page).toEqual({ type: "integer" });
  });

  it("should point repeat refs from the innermost nested resource", async () => {
    const { bundled, dereferenced } = await bundlePortably("nested.schema.json");
    const inner = bundled.properties.search.properties.inner;

    expect(inner.$id).toBe("inner/inner.schema.json");
    expect(inner.properties.test2.$ref).toBe("#/properties/test1");
    expect(dereferenced.properties.search.properties.inner.properties.test2).toEqual(testSchema);
  });

  it("should still qualify refs whose target is outside the nested resource", async () => {
    const bundled = await new $RefParser().bundle(fixture("outside.schema.json"));
    const search = bundled.properties.search;

    // No ref written inside the resource can reach the document root without a root $id.
    expect(search.$id).toBe("requests/search.schema.json");
    expect(search.properties.test1.$ref).toMatch(/outside\.schema\.json#\/properties\/a$/);
  });
});
