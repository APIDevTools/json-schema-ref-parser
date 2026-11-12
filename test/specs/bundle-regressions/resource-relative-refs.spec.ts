import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

const rootUrl = "mem://schemas/root.json";
const relocatedUrl = "mem://relocated/bundle.json";
const draft2020 = "https://json-schema.org/draft/2020-12/schema";
const payload = { type: "object", properties: { name: { type: "string" } } };

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

async function relocate(schema: unknown) {
  return $RefParser.dereference(relocatedUrl, JSON.parse(JSON.stringify(schema)), {
    resolve: resolverFor({}),
  });
}

describe("bundling resource-relative references", () => {
  for (const optimizeInternalRefs of [true, false]) {
    describe(`optimizeInternalRefs: ${optimizeInternalRefs}`, () => {
      it("preserves a deeply shared schema while remapping references", async () => {
        let shared: any = { type: "string" };
        for (let depth = 0; depth < 26; depth++) {
          shared = { properties: { left: shared, right: shared } };
        }
        const bundled = await $RefParser.bundle(
          rootUrl,
          {
            $schema: draft2020,
            definitions: { a: { $ref: "payload.json" }, b: { $ref: "payload.json" } },
            properties: { shared },
          },
          {
            bundle: { optimizeInternalRefs },
            resolve: resolverFor({ "mem://schemas/payload.json": payload }),
          },
        );
        expect(bundled.definitions.b.$ref).toBe("#/definitions/a");
        expect(bundled.properties.shared).toBe(shared);
        expect(shared.properties.left).toBe(shared.properties.right);
      });

      for (const pageRef of ["#/$defs/page", "resource.json#/$defs/page"]) {
        it(`keeps repeated refs portable without a root $id and preserves ${pageRef}`, async () => {
          const bundled = await $RefParser.bundle(
            rootUrl,
            {
              $schema: draft2020,
              properties: { search: { $ref: "source.json" } },
            },
            {
              bundle: { optimizeInternalRefs },
              resolve: resolverFor({
                "mem://schemas/source.json": {
                  $id: "resource.json",
                  $defs: { page: { type: "integer" } },
                  properties: {
                    test1: { $ref: "payload.json" },
                    test2: { $ref: "payload.json" },
                    page: { $ref: pageRef },
                  },
                },
                "mem://schemas/payload.json": payload,
              }),
            },
          );

          expect(bundled.properties.search.$id).toBe("resource.json");
          expect(bundled.properties.search.properties.test2.$ref).toBe("#/properties/test1");
          expect(bundled.properties.search.properties.page.$ref).toBe(pageRef);
          expect(JSON.stringify(bundled)).not.toContain(rootUrl);

          const dereferenced = await relocate(bundled);
          const search = dereferenced.properties.search;
          expect(search.properties.test2).toEqual(payload);
          expect(search.properties.test2).toBe(search.properties.test1);
          expect(search.properties.page).toEqual({ type: "integer" });
        });
      }

      it("uses the innermost resource root after relocating nested relative identifiers", async () => {
        const bundled = await $RefParser.bundle(
          rootUrl,
          { $schema: draft2020, properties: { search: { $ref: "source.json" } } },
          {
            bundle: { optimizeInternalRefs },
            resolve: resolverFor({
              "mem://schemas/source.json": {
                $id: "outer/resource.json",
                properties: {
                  inner: {
                    $id: "inner/resource.json",
                    properties: {
                      test1: { $ref: "../../payload.json" },
                      test2: { $ref: "../../payload.json" },
                    },
                  },
                },
              },
              "mem://schemas/payload.json": payload,
            }),
          },
        );

        expect(bundled.properties.search.$id).toBe("outer/resource.json");
        const inner = bundled.properties.search.properties.inner;
        expect(inner.$id).toBe("inner/resource.json");
        expect(inner.properties.test2.$ref).toBe("#/properties/test1");
        expect(JSON.stringify(bundled)).not.toContain(rootUrl);
        const dereferenced = await relocate(bundled);
        const restoredInner = dereferenced.properties.search.properties.inner;
        expect(restoredInner.properties.test2).toEqual(payload);
        expect(restoredInner.properties.test2).toBe(restoredInner.properties.test1);
      });

      it("preserves escaped tokens in resource-relative target paths", async () => {
        const bundled = await $RefParser.bundle(
          rootUrl,
          { $schema: draft2020, properties: { search: { $ref: "source.json" } } },
          {
            bundle: { optimizeInternalRefs },
            resolve: resolverFor({
              "mem://schemas/source.json": {
                $id: "resource.json",
                properties: {
                  "a/b~c": { $ref: "payload.json" },
                  repeat: { $ref: "payload.json#/properties/name~1value~0" },
                },
              },
              "mem://schemas/payload.json": {
                type: "object",
                properties: { "name/value~": { type: "string" } },
              },
            }),
          },
        );

        expect(bundled.properties.search.properties.repeat.$ref).toBe("#/properties/a~1b~0c/properties/name~1value~0");
        const dereferenced = await relocate(bundled);
        expect(dereferenced.properties.search.properties.repeat).toEqual({ type: "string" });
      });

      it("optimizes resource-relative pointers against that resource instead of a matching root path", async () => {
        const bundled = await $RefParser.bundle(
          rootUrl,
          {
            $id: rootUrl,
            $defs: { decoy: { type: "object", properties: { name: { type: "number" } } } },
            properties: {
              test1: { $ref: "#/$defs/decoy" },
              search: { $ref: "source.json" },
            },
          },
          {
            bundle: { optimizeInternalRefs },
            resolve: resolverFor({
              "mem://schemas/source.json": {
                $id: "resource.json",
                properties: {
                  test1: { $ref: "payload.json" },
                  test2: { $ref: "payload.json#/properties/name" },
                },
              },
              "mem://schemas/payload.json": payload,
            }),
          },
        );

        const dereferenced = await relocate(bundled);
        expect(dereferenced.properties.search.properties.test2).toEqual({ type: "string" });
        expect(dereferenced.properties.test1.properties.name).toEqual({ type: "number" });
      });

      it("optimizes authored local pointers within their own resource", async () => {
        const bundled = await $RefParser.bundle(
          rootUrl,
          {
            $id: rootUrl,
            $defs: { decoy: { properties: { name: { type: "number" } } } },
            properties: {
              a: { $ref: "#/$defs/decoy" },
              search: {
                $id: "resource.json",
                $defs: { own: { properties: { name: { type: "string" } } } },
                properties: {
                  a: { $ref: "#/$defs/own" },
                  b: { $ref: "#/properties/a/properties/name" },
                },
              },
            },
          },
          { bundle: { optimizeInternalRefs }, resolve: resolverFor({}) },
        );

        expect(bundled.properties.search.properties.b.$ref).toBe(
          optimizeInternalRefs ? "#/$defs/own/properties/name" : "#/properties/a/properties/name",
        );
        const dereferenced = await relocate(bundled);
        expect(dereferenced.properties.search.properties.b).toEqual({ type: "string" });
        expect(dereferenced.properties.a.properties.name).toEqual({ type: "number" });
      });

      it("keeps a shared ref valid in different resource scopes", async () => {
        const shared = { $ref: "mem://schemas/payload.json" };
        const bundled = await $RefParser.bundle(
          rootUrl,
          {
            $id: rootUrl,
            $defs: {
              a: {
                $id: "a.json",
                properties: { a: { $ref: "mem://schemas/payload.json" }, repeat: shared },
              },
              b: { $id: "b.json", properties: { repeat: shared } },
            },
          },
          {
            bundle: { optimizeInternalRefs },
            resolve: resolverFor({ "mem://schemas/payload.json": payload }),
          },
        );

        expect(bundled.$defs.a.properties.repeat).toBe(bundled.$defs.b.properties.repeat);
        expect(bundled.$defs.a.properties.repeat.$ref).not.toMatch(/^#/);
        const dereferenced = await relocate(bundled);
        expect(dereferenced.$defs.a.properties.repeat).toBe(dereferenced.$defs.a.properties.a);
        expect(dereferenced.$defs.b.properties.repeat).toBe(dereferenced.$defs.a.properties.a);
        expect(dereferenced.$defs.b.properties.repeat).toEqual(payload);
      });

      it("keeps recursive external subtrees portable inside a nested resource", async () => {
        const bundled = await $RefParser.bundle(
          rootUrl,
          { $schema: draft2020, properties: { search: { $ref: "source.json" } } },
          {
            bundle: { optimizeInternalRefs },
            resolve: resolverFor({
              "mem://schemas/source.json": {
                $id: "resource.json",
                properties: {
                  children: { $ref: "tree.json#/properties/children", maxItems: 1 },
                },
              },
              "mem://schemas/tree.json": {
                type: "object",
                properties: { children: { type: "array", items: { $ref: "#" } } },
              },
            }),
          },
        );

        expect(JSON.stringify(bundled)).not.toContain(rootUrl);
        const dereferenced = await relocate(bundled);
        const children = dereferenced.properties.search.properties.children;
        expect(children.maxItems).toBe(1);
        expect(children.items.properties.children).not.toHaveProperty("maxItems");
        expect(children.items.properties.children.items).toBe(children.items);
      });

      it("keeps document-relative behavior when the root does not enable schema identifier scopes", async () => {
        const bundled = await $RefParser.bundle(
          rootUrl,
          { properties: { search: { $ref: "source.json" } } },
          {
            bundle: { optimizeInternalRefs },
            resolve: resolverFor({
              "mem://schemas/source.json": {
                $id: "mem://schemas/resource.json",
                properties: {
                  test1: { $ref: "payload.json" },
                  test2: { $ref: "payload.json" },
                },
              },
              "mem://schemas/payload.json": payload,
            }),
          },
        );

        // Generic JSON does not activate nested $id semantics on subsequent
        // reads, even when an external document used those semantics itself.
        const dereferenced = await $RefParser.dereference(rootUrl, JSON.parse(JSON.stringify(bundled)), {
          resolve: resolverFor({}),
        });
        const search = dereferenced.properties.search;
        expect(search.properties.test2).toEqual(payload);
        expect(search.properties.test2).toBe(search.properties.test1);
      });

      for (const draft of ["draft-04", "draft-07"]) {
        for (const nestedResource of [false, true]) {
          it(`keeps ${draft} plain-name identifiers in their containing ${nestedResource ? "nested" : "root"} resource`, async () => {
            const identifier = draft === "draft-04" ? "id" : "$id";
            const named = {
              [identifier]: "#foo",
              properties: {
                a: { $ref: "payload.json" },
                b: { $ref: "payload.json" },
              },
            };
            const definitions = nestedResource
              ? { resource: { [identifier]: "resource.json", definitions: { named } } }
              : { named };
            const bundled = await $RefParser.bundle(
              rootUrl,
              {
                $schema: `http://json-schema.org/${draft}/schema#`,
                [identifier]: rootUrl,
                definitions,
              },
              {
                bundle: { optimizeInternalRefs },
                resolve: resolverFor({ "mem://schemas/payload.json": { type: "string" } }),
              },
            );

            const dereferenced = await relocate(bundled);
            const restored = nestedResource
              ? dereferenced.definitions.resource.definitions.named
              : dereferenced.definitions.named;
            expect(restored[identifier]).toBe("#foo");
            expect(restored.properties.b).toEqual({ type: "string" });
            expect(restored.properties.b).toBe(restored.properties.a);
          });
        }
      }

      for (const rootId of [undefined, rootUrl]) {
        it(`qualifies targets outside a nested resource ${rootId ? "with" : "without"} a root $id`, async () => {
          const bundled = await $RefParser.bundle(
            rootUrl,
            {
              $schema: draft2020,
              ...(rootId === undefined ? {} : { $id: rootId }),
              properties: { a: { $ref: "payload.json" }, search: { $ref: "source.json" } },
            },
            {
              bundle: { optimizeInternalRefs },
              resolve: resolverFor({
                "mem://schemas/source.json": {
                  $id: "resource.json",
                  properties: { test1: { $ref: "payload.json" }, test2: { $ref: "payload.json" } },
                },
                "mem://schemas/payload.json": payload,
              }),
            },
          );

          const search = bundled.properties.search;
          expect(search.$id).toBe("resource.json");
          expect(new URL(search.properties.test1.$ref, "mem://schemas/resource.json").href).toBe(
            `${rootUrl}#/properties/a`,
          );
          expect(search.properties.test2.$ref).toBe(search.properties.test1.$ref);
          if (rootId !== undefined) {
            const dereferenced = await relocate(bundled);
            expect(dereferenced.properties.search.properties.test1).toBe(dereferenced.properties.a);
            expect(dereferenced.properties.search.properties.test2).toEqual(payload);
          }
        });
      }
    });
  }
});
