import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

const targetRef = "#/$defs/target";

function createOrderSchema(extendedFirst: boolean) {
  const plain = { $ref: targetRef };
  const extended = {
    $ref: targetRef,
    description: "sibling description",
    properties: {
      fromSibling: { $ref: "#/$defs/sibling" },
    },
  };

  return {
    $defs: {
      target: {
        type: "object",
        description: "target description",
        properties: {
          fromTarget: { type: "string" },
        },
      },
      sibling: { type: "number" },
    },
    ...(extendedFirst ? { extended, plain } : { plain, extended }),
  };
}

describe("extended $ref dereferencing", () => {
  it("preserves cached circular identity and notifications when cloning extended references", async () => {
    const circularPaths: string[] = [];
    const result = await $RefParser.dereference(
      {
        plain: { $ref: targetRef },
        extended: {
          $ref: targetRef,
          description: "sibling description",
          sibling: { $ref: "#/$defs/sibling" },
        },
        $defs: {
          target: { type: "object", properties: { self: { $ref: targetRef } } },
          sibling: { type: "string" },
        },
      },
      { dereference: { cloneReferences: true, onCircular: (path) => circularPaths.push(path) } },
    );

    expect(result.extended.description).toBe("sibling description");
    expect(result.extended.sibling).toEqual({ type: "string" });
    expect(result.extended.properties.self).toBe(result.plain);
    expect(circularPaths.some((path) => path.endsWith("#/extended"))).toBe(true);
  });

  it("can remove a cached target's cycle by overriding its circular property", async () => {
    const circularPaths: string[] = [];
    const result = await $RefParser.dereference(
      {
        plain: { $ref: targetRef },
        extended: { $ref: targetRef, properties: { value: { type: "string" } } },
        $defs: { target: { type: "object", properties: { self: { $ref: targetRef } } } },
      },
      { dereference: { mergeKeys: false, cloneReferences: true, onCircular: (path) => circularPaths.push(path) } },
    );

    expect(result.extended).toEqual({ type: "object", properties: { value: { type: "string" } } });
    expect(circularPaths.some((path) => path.endsWith("#/extended"))).toBe(false);
  });

  it.each([false, true])(
    "preserves siblings of cached circular targets (extended first: %s)",
    async (extendedFirst) => {
      const plain = { $ref: targetRef };
      const extended = { $ref: targetRef, description: "sibling description" };
      const result = await $RefParser.dereference({
        ...(extendedFirst ? { extended, plain } : { plain, extended }),
        $defs: {
          target: { type: "object", properties: { self: { $ref: targetRef } } },
        },
      });

      expect(result.extended.description).toBe("sibling description");
      expect(result.plain).not.toHaveProperty("description");
      expect(result.plain.properties.self).toBe(result.plain);
      expect(result.extended.properties.self).toBe(result.plain);
    },
  );

  it("is independent of whether a plain reference populated the cache first", async () => {
    const plainFirst = (await $RefParser.dereference(createOrderSchema(false))) as any;
    const extendedFirst = (await $RefParser.dereference(createOrderSchema(true))) as any;

    const expected = {
      type: "object",
      description: "sibling description",
      properties: {
        fromTarget: { type: "string" },
        fromSibling: { type: "number" },
      },
    };

    expect(plainFirst.extended).toEqual(expected);
    expect(extendedFirst.extended).toEqual(expected);
  });

  it("respects mergeKeys=false after a plain reference populated the cache", async () => {
    const result = (await $RefParser.dereference(createOrderSchema(false), {
      dereference: { mergeKeys: false },
    })) as any;

    expect(result.extended).toEqual({
      type: "object",
      description: "sibling description",
      properties: {
        fromSibling: { type: "number" },
      },
    });
  });

  it("replaces conflicting arrays without retaining trailing target elements", async () => {
    const result = (await $RefParser.dereference({
      $defs: {
        target: {
          prefixItems: [{ type: "string" }, { type: "number" }],
        },
      },
      plain: { $ref: targetRef },
      extended: {
        $ref: targetRef,
        prefixItems: [{ const: "replacement" }],
      },
    })) as any;

    expect(result.extended.prefixItems).toEqual([{ const: "replacement" }]);
  });

  it("does not throw when a cached reference target is a primitive", async () => {
    const result = (await $RefParser.dereference({
      $defs: { target: 42 },
      plain: { $ref: targetRef },
      extended: { $ref: targetRef, description: "not applicable to a primitive" },
    } as any)) as any;

    expect(result.plain).toBe(42);
    expect(result.extended).toBe(42);
  });

  it("uses an external schema root $id as the base for its nested references", async () => {
    const documents: Record<string, object> = {
      "https://schemas.example/external/root.json": {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "./scoped/",
        type: "object",
        properties: {
          child: { $ref: "child.json" },
        },
      },
      // Preloading both candidates isolates dereference-time scope selection from external crawling.
      "https://schemas.example/external/child.json": { type: "string" },
      "https://schemas.example/external/scoped/child.json": { type: "integer" },
    };

    const result = (await $RefParser.dereference(
      "https://schemas.example/root.json",
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        preloadUnscoped: { $ref: "./external/child.json" },
        preloadScoped: { $ref: "./external/scoped/child.json" },
        external: { $ref: "./external/root.json" },
      },
      {
        resolve: {
          file: false,
          http: false,
          virtual: {
            order: 1,
            canRead(file: { url: string }) {
              return Object.hasOwn(documents, file.url);
            },
            read(file: { url: string }) {
              return structuredClone(documents[file.url]);
            },
          },
        },
      } as any,
    )) as any;

    expect(result.external.properties.child).toEqual({ type: "integer" });
  });

  it("preserves dangerous JSON keys as own data without changing object prototypes", async () => {
    const schema = JSON.parse(`{
      "$defs": {
        "target": {
          "__proto__": { "fromTarget": true },
          "constructor": { "fromTarget": true },
          "prototype": { "fromTarget": true },
          "nested": {
            "__proto__": { "fromTarget": true },
            "constructor": { "fromTarget": true },
            "prototype": { "fromTarget": true }
          }
        }
      },
      "plain": { "$ref": "#/$defs/target" },
      "copy": { "$ref": "#/$defs/target", "title": "copy" },
      "merged": {
        "$ref": "#/$defs/target",
        "__proto__": { "fromSibling": true },
        "constructor": { "fromSibling": true },
        "prototype": { "fromSibling": true },
        "nested": {
          "__proto__": { "fromSibling": true },
          "constructor": { "fromSibling": true },
          "prototype": { "fromSibling": true }
        }
      }
    }`);

    const result = (await $RefParser.dereference(schema)) as any;

    for (const value of [result.copy, result.merged, result.merged.nested]) {
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
      expect(Object.hasOwn(value, "__proto__")).toBe(true);
      expect(Object.hasOwn(value, "constructor")).toBe(true);
      expect(Object.hasOwn(value, "prototype")).toBe(true);
    }

    expect(result.copy["__proto__"]).toEqual({ fromTarget: true });
    expect(result.copy.constructor).toEqual({ fromTarget: true });
    expect(result.copy.prototype).toEqual({ fromTarget: true });

    for (const value of [result.merged, result.merged.nested]) {
      expect(value["__proto__"]).toEqual({ fromTarget: true, fromSibling: true });
      expect(value.constructor).toEqual({ fromTarget: true, fromSibling: true });
      expect(value.prototype).toEqual({ fromTarget: true, fromSibling: true });
    }

    expect(({} as any).fromTarget).toBeUndefined();
    expect(({} as any).fromSibling).toBeUndefined();
  });
});
