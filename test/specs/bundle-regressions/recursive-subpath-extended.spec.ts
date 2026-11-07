import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

const rootUrl = "mem://schemas/root.json";
const treeUrl = "mem://schemas/tree.json";

function resolverFor(documents: Record<string, unknown>) {
  return {
    file: false as const,
    http: false as const,
    mem: {
      canRead: /^mem:/,
      read(file: { url: string }) {
        const document = documents[file.url];
        if (document === undefined) {
          throw new Error(`Unexpected memory URL: ${file.url}`);
        }
        return JSON.stringify(document);
      },
    },
  };
}

function restoreBundle(schema: unknown) {
  const restored = JSON.parse(JSON.stringify(schema));
  const visit = (value: any) => {
    if (!value || typeof value !== "object") {
      return;
    }
    if (typeof value.$ref === "string") {
      expect(value.$ref).toMatch(/^#(?:\/|$)/);
      let target = restored;
      const tokens = decodeURIComponent(value.$ref.slice(1))
        .split("/")
        .slice(1)
        .map((token: string) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
      for (const token of tokens) {
        // A JSON Pointer must traverse literal properties, without following refs.
        expect(target !== null && typeof target === "object" && Object.hasOwn(target, token)).toBe(true);
        target = target[token];
      }
    }
    Object.values(value).forEach(visit);
  };
  visit(restored);
  return restored;
}

describe("bundling extended recursive external sub-paths (issue #435)", () => {
  it("preserves escaped pointer tokens while retaining a recursive source", async () => {
    const bundled = await $RefParser.bundle(
      rootUrl,
      { "child/list~": { $ref: "tree.json#/properties/child~1list~0", maxItems: 1 } },
      {
        resolve: resolverFor({
          [treeUrl]: {
            type: "object",
            properties: {
              "child/list~": { type: "array", items: { $ref: "#" } },
            },
          },
        }),
      },
    );

    const dereferenced = await $RefParser.dereference("mem://relocated/bundle.json", restoreBundle(bundled), {
      resolve: resolverFor({}),
    });
    const children = dereferenced["child/list~"];
    expect(children.maxItems).toBe(1);
    expect(children.items.properties["child/list~"]).not.toHaveProperty("maxItems");
    expect(children.items.properties["child/list~"].items).toBe(children.items);
  });

  it("does not propagate a sibling override along the recursive ancestor path", async () => {
    const directlyDereferenced = await $RefParser.dereference(
      rootUrl,
      { children: { $ref: "tree.json#/properties/children", items: { title: "Immediate item only" } } },
      {
        resolve: resolverFor({
          [treeUrl]: {
            type: "object",
            properties: {
              children: { type: "array", items: { $ref: "#" } },
            },
          },
        }),
      },
    );
    expect(directlyDereferenced.children.items.properties.children.items).not.toHaveProperty("title");

    const bundled = await $RefParser.bundle(
      rootUrl,
      { children: { $ref: "tree.json#/properties/children", items: { title: "Immediate item only" } } },
      {
        resolve: resolverFor({
          [treeUrl]: {
            type: "object",
            properties: {
              children: { type: "array", items: { $ref: "#" } },
            },
          },
        }),
      },
    );

    const dereferenced = await $RefParser.dereference("mem://relocated/bundle.json", restoreBundle(bundled), {
      resolve: resolverFor({}),
    });
    const firstItem = dereferenced.children.items;
    const recursiveItem = firstItem.properties.children.items;
    expect(firstItem.title).toBe("Immediate item only");
    expect(recursiveItem).not.toHaveProperty("title");
    expect(recursiveItem.properties.children.items).toBe(recursiveItem);
  });

  for (const optimizeInternalRefs of [true, false]) {
    it(`keeps sibling constraints out of the recursive source (optimizeInternalRefs: ${optimizeInternalRefs})`, async () => {
      const bundled = await $RefParser.bundle(
        rootUrl,
        { children: { $ref: "tree.json#/properties/children", maxItems: 1 } },
        {
          bundle: { optimizeInternalRefs },
          resolve: resolverFor({
            [treeUrl]: {
              type: "object",
              properties: {
                children: { type: "array", items: { $ref: "#" } },
              },
            },
          }),
        },
      );

      // Serialization also checks that bundling did not introduce an object cycle.
      const dereferenced = await $RefParser.dereference("mem://relocated/bundle.json", restoreBundle(bundled), {
        resolve: resolverFor({}),
      });
      const children = dereferenced.children;
      const recursiveChildren = children.items.properties.children;
      expect(children.type).toBe("array");
      expect(children.maxItems).toBe(1);
      expect(recursiveChildren.type).toBe("array");
      expect(recursiveChildren).not.toHaveProperty("maxItems");
      expect(recursiveChildren.items).toBe(children.items);
    });

    it(`retains later external inlines along a deeper recursive path (optimizeInternalRefs: ${optimizeInternalRefs})`, async () => {
      const bundled = await $RefParser.bundle(
        rootUrl,
        { children: { $ref: "tree.json#/properties/children", maxItems: 1 } },
        {
          bundle: { optimizeInternalRefs },
          resolve: resolverFor({
            [treeUrl]: {
              type: "object",
              properties: {
                children: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      next: { $ref: "#" },
                      payload: { $ref: "z-payload.json" },
                    },
                  },
                },
              },
            },
            "mem://schemas/z-payload.json": { type: "string", minLength: 2 },
          }),
        },
      );

      const dereferenced = await $RefParser.dereference("mem://relocated/bundle.json", restoreBundle(bundled), {
        resolve: resolverFor({}),
      });
      const children = dereferenced.children;
      const tree = children.items.properties.next;
      const recursiveChildren = tree.properties.children;
      expect(children.maxItems).toBe(1);
      expect(recursiveChildren).not.toHaveProperty("maxItems");
      expect(recursiveChildren.items.properties.next).toBe(tree);
      expect(children.items.properties.payload).toEqual({ type: "string", minLength: 2 });
      expect(recursiveChildren.items.properties.payload).toEqual({ type: "string", minLength: 2 });
    });
  }
});
