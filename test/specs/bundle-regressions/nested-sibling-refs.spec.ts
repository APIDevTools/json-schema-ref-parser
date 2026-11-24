import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

const root = "mem://schemas/start/root.json";
const relocated = "mem://offline/bundle.json";

function resolver(documents: Record<string, unknown>) {
  return {
    file: false as const,
    http: false as const,
    mem: {
      canRead: /^mem:/,
      read({ url }: { url: string }) {
        if (!Object.hasOwn(documents, url)) {
          throw new Error(`Unexpected document ${url}`);
        }
        return JSON.stringify(documents[url]);
      },
    },
  };
}

describe("references in the sibling properties of extended references", () => {
  for (const optimizeInternalRefs of [true, false]) {
    it(`retains the source of each child across an indirect merge (optimizeInternalRefs: ${optimizeInternalRefs})`, async () => {
      const schema = {
        a: { $ref: "../wrapper/record.json", description: "only on a" },
        original: { $ref: "../wrapper/record.json" },
      };
      const resolve = resolver({
        "mem://schemas/wrapper/record.json": {
          $ref: "../base/record.json",
          properties: { authored: { $ref: "child.json" } },
        },
        "mem://schemas/base/record.json": { properties: { inherited: { $ref: "child.json" } } },
        "mem://schemas/wrapper/child.json": { const: "wrapper" },
        "mem://schemas/base/child.json": { const: "base" },
      });
      const bundled = await $RefParser.bundle(root, schema, { resolve, bundle: { optimizeInternalRefs } });
      const restored: any = await $RefParser.dereference(relocated, JSON.parse(JSON.stringify(bundled)), {
        resolve: resolver({}),
      });
      const properties = { authored: { const: "wrapper" }, inherited: { const: "base" } };
      expect(restored.a).toEqual({ description: "only on a", properties });
      expect(restored.original).toEqual({ properties });
    });
  }

  it("keeps literal sibling references at their caller when the shared target moves", async () => {
    const id = "mem://schemas/shared/model.json";
    const rootResource = { type: "string", minLength: 1 };
    const schema = {
      $id: root,
      $defs: {
        A: {
          $ref: id,
          properties: {
            first: { $ref: "child.json" },
            second: { $ref: "child.json" },
            local: { $ref: "#/$defs/rootResource" },
            skipped: { $ref: "skipped.json" },
          },
        },
        B: { $ref: id, description: "only on B" },
        rootResource,
      },
    };
    const resolve = resolver({
      [id]: { $id: id, properties: { inherited: { $ref: "child.json" } } },
      "mem://schemas/shared/child.json": { const: "target" },
      "mem://schemas/start/child.json": { const: "caller" },
    });
    const skip = (path: string) => path.endsWith("/skipped");
    const bundled = await $RefParser.bundle(root, schema, {
      resolve,
      resolveExcludedPathMatcher: skip,
      bundle: { excludedPathMatcher: skip },
    });
    const restored: any = await $RefParser.dereference(relocated, JSON.parse(JSON.stringify(bundled)), {
      resolve: resolver({}),
      resolveExcludedPathMatcher: skip,
      dereference: { excludedPathMatcher: skip },
    });
    expect(restored.$defs.A.properties).toEqual({
      inherited: { const: "target" },
      first: { const: "caller" },
      second: { const: "caller" },
      local: rootResource,
      skipped: { $ref: "skipped.json" },
    });
    expect(restored.$defs.B.properties).toEqual({ inherited: { const: "target" } });
  });

  it("applies nested inline rewrites before deep-merging an outer reference", async () => {
    const schema = {
      selected: {
        $ref: "../base/record.json",
        properties: { authored: { $ref: "z.json", items: { $ref: "z-item.json" } } },
      },
    };
    const resolve = resolver({
      "mem://schemas/base/record.json": { properties: { inherited: { $ref: "z.json" } } },
      "mem://schemas/base/z.json": { const: "base" },
      "mem://schemas/start/z.json": { type: "array" },
      "mem://schemas/start/z-item.json": { type: "integer" },
    });
    const bundled = await $RefParser.bundle(root, schema, { resolve });
    const restored: any = await $RefParser.dereference(relocated, JSON.parse(JSON.stringify(bundled)), {
      resolve: resolver({}),
    });
    expect(restored.selected.properties).toEqual({
      inherited: { const: "base" },
      authored: { type: "array", items: { type: "integer" } },
    });
  });

  for (const keepOriginal of [false, true]) {
    it(`preserves the winning $ref across a deep merge (separate original: ${keepOriginal})`, async () => {
      const base = "../base/record.json";
      const schema = {
        selected: { $ref: base, properties: { value: { $ref: "new.json", title: "override" } } },
        ...(keepOriginal && { original: { $ref: base } }),
      };
      const resolve = resolver({
        "mem://schemas/base/record.json": { properties: { value: { $ref: "old.json", minimum: 0 } } },
        "mem://schemas/base/old.json": { type: "integer", description: "only in the old schema" },
        "mem://schemas/start/new.json": { type: "number" },
      });
      const bundled = await $RefParser.bundle(root, schema, { resolve });
      const restored: any = await $RefParser.dereference(relocated, JSON.parse(JSON.stringify(bundled)), {
        resolve: resolver({}),
      });
      expect(restored.selected.properties.value).toEqual({ type: "number", title: "override", minimum: 0 });
      if (keepOriginal) {
        expect(restored.original.properties.value).toEqual({
          type: "integer",
          description: "only in the old schema",
          minimum: 0,
        });
      }
    });
  }
});
