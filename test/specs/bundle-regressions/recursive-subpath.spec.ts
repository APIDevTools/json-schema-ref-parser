import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("bundling a recursive external sub-path (issue #435)", () => {
  for (const optimizeInternalRefs of [true, false]) {
    it(`preserves a recursive array and its ancestor (optimizeInternalRefs: ${optimizeInternalRefs})`, async () => {
      const bundled = await $RefParser.bundle(
        "mem://schemas/root.json",
        {
          components: {
            schemas: {
              Children: { $ref: "tree.json#/properties/children" },
              OtherChildren: { $ref: "tree.json#/properties/children" },
            },
          },
        },
        {
          bundle: { optimizeInternalRefs },
          resolve: {
            mem: {
              canRead: /^mem:/,
              read: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  children: { type: "array", items: { $ref: "#" } },
                },
              },
            },
          },
        },
      );

      expect(bundled).toEqual({
        components: {
          schemas: {
            Children: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  children: { $ref: "#/components/schemas/Children" },
                },
              },
            },
            OtherChildren: { $ref: "#/components/schemas/Children" },
          },
        },
      });

      // A bundle must survive JSON serialization and resolve without its source files.
      const restored = JSON.parse(JSON.stringify(bundled));
      const dereferenced = await $RefParser.dereference(restored, { resolve: { file: false, http: false } });
      expect(dereferenced.components.schemas.Children.items.properties.children).toBe(
        dereferenced.components.schemas.Children,
      );
      expect(dereferenced.components.schemas.OtherChildren).toBe(dereferenced.components.schemas.Children);
    });
  }

  for (const extended of [false, true]) {
    it(`qualifies the recursive reference inside an ancestor with its own $id (extended: ${extended})`, async () => {
      const rootUrl = "mem://schemas/root.json";
      const treeUrl = "mem://schemas/tree.json";
      const bundled = await $RefParser.bundle(
        rootUrl,
        {
          $id: rootUrl,
          children: { $ref: "tree.json#/properties/children", ...(extended ? { maxItems: 1 } : {}) },
        },
        {
          resolve: {
            mem: {
              canRead: /^mem:/,
              read: {
                $id: treeUrl,
                type: "object",
                properties: { children: { type: "array", items: { $ref: "#" } } },
              },
            },
          },
        },
      );

      const dereferenced = await $RefParser.dereference(
        "mem://relocated/bundle.json",
        JSON.parse(JSON.stringify(bundled)),
        { resolve: { file: false, http: false } },
      );
      const children = dereferenced.children;
      expect(children.items.properties.children.items).toBe(children.items);
      expect(children.items.properties.children).not.toHaveProperty("maxItems");
      if (extended) {
        expect(children.maxItems).toBe(1);
      } else {
        expect(children.items.properties.children).toBe(children);
      }
    });
  }

  it("preserves references to other sub-paths of the recursive ancestor", async () => {
    const bundled = await $RefParser.bundle(
      "mem://schemas/root.json",
      {
        children: { $ref: "tree.json#/$defs/node/properties/children" },
        name: { $ref: "tree.json#/$defs/node/properties/name" },
      },
      {
        resolve: {
          mem: {
            canRead: /^mem:/,
            read: {
              $defs: {
                node: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    children: { type: "array", items: { $ref: "#/$defs/node" } },
                  },
                },
              },
            },
          },
        },
      },
    );

    expect(bundled.children).toEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          children: { $ref: "#/children" },
        },
      },
    });
    expect(bundled.name.$ref).toBe("#/children/items/properties/name");
    const dereferenced = await $RefParser.dereference(JSON.parse(JSON.stringify(bundled)), {
      resolve: { file: false, http: false },
    });
    expect(dereferenced.name).toEqual({ type: "string" });
    expect(dereferenced.children.items.properties.children).toBe(dereferenced.children);
  });
});
