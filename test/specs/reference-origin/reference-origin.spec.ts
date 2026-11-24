import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import $Refs from "../../../lib/refs.js";
import { resolveReferencePath } from "../../../lib/resolve-external/reference-path.js";
import { ResolverError } from "../../../lib/util/errors.js";

const remote = "https://schemas.example/root.json";
const local = "file:///schemas/local.json";
const noReaders = { resolve: { file: false, http: false } };

describe.skipIf(typeof window !== "undefined")("reference document origin", () => {
  it("checks access independently for each referring document before or after a target is registered", () => {
    const refs = new $Refs();
    const origin = refs._add(remote);
    const source = remote + "#/properties/item";
    const options = { continueOnError: true };

    expect(resolveReferencePath(remote, local, source, refs, options)).toBeUndefined();
    expect(refs._$refs[local]).toBeUndefined();
    expect(resolveReferencePath(local, local, local, refs, options)).toBe(local);
    const cached = refs._add(local);
    cached.value = { type: "string" };
    expect(resolveReferencePath(remote, local, source, refs, options)).toBeUndefined();
    expect(resolveReferencePath(local, local, local, refs, options)).toBe(local);
    expect(() => resolveReferencePath(remote, local, source, refs, {})).toThrow(ResolverError);
    expect(origin.errors).toMatchObject([{ source: remote, path: ["properties", "item"], code: "ERESOLVER" }]);
    expect(cached.errors).toEqual([]);
    expect(cached.value).toEqual({ type: "string" });
  });

  for (const withMatcher of [false, true]) {
    const options = { ...noReaders, ...(withMatcher ? { resolveExcludedPathMatcher: () => false } : {}) };
    const mode = withMatcher ? "with a matcher" : "without a matcher";

    it(`reports the referring property when root-relative resolution selects a local path ${mode}`, async () => {
      const schema = { properties: { item: { $ref: "item.json" } } };
      await expect(
        $RefParser.resolve(remote, schema, {
          ...options,
          dereference: { externalReferenceResolution: "root" },
          continueOnError: true,
        }),
      ).rejects.toMatchObject({
        errors: [{ code: "ERESOLVER", source: remote, path: ["properties", "item"] }],
      });
    });

    it(`uses embedded resource IDs in a remote document ${mode}`, async () => {
      const schema = {
        $id: remote,
        $defs: { item: { $id: local, type: "string" } },
        properties: { item: { $ref: local } },
      };
      const result = await $RefParser.dereference(remote, schema, options);
      expect(result.properties.item).toBe(result.$defs.item);
    });

    it(`preserves local file resolution through an HTTP canonical ID ${mode}`, async () => {
      const schema = {
        $id: "https://schemas.example/canonical-root.json",
        properties: { selected: { $ref: remote } },
        $defs: { resource: { $id: remote, properties: { item: { $ref: local } } } },
      };
      const result = await $RefParser.dereference("file:///schemas/root.json", schema, {
        ...options,
        resolve: {
          ...options.resolve,
          memory: { canRead: (file) => file.url === local, read: () => '{"type":"string"}' },
        },
      });
      expect(result.properties.selected.properties.item).toEqual({ type: "string" });
    });
  }
});
