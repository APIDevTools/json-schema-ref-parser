import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import Pointer from "../../../lib/pointer.js";

describe("encoded pointer fragments", () => {
  it.each(["%2F", "%2f"])("recognizes an encoded leading separator %s", async (separator) => {
    const schema = {
      definitions: { foo: { type: "string" } },
      value: { $ref: `#${separator}definitions/foo` },
    };

    const result = await $RefParser.dereference(schema);

    expect(result.value).toBe(result.definitions.foo);
  });

  it.each([true, false])(
    "preserves an encoded leading separator after bundling (optimizeInternalRefs: %s)",
    async (optimizeInternalRefs) => {
      const base = "https://example.com/root.json";
      const schema = {
        definitions: { foo: { type: "string" } },
        value: { $ref: `${base}#%2Fdefinitions/foo` },
      };

      const bundled = await $RefParser.bundle(base, schema, { bundle: { optimizeInternalRefs } });
      const result = await $RefParser.dereference(base, bundled, { resolve: { http: false, file: false } });

      expect(result.value).toBe(result.definitions.foo);
    },
  );

  it("decodes a percent-encoded fragment exactly once while dereferencing", async () => {
    const schema = {
      definitions: { "%41": { type: "string" }, A: { type: "number" } },
      value: { $ref: "#/definitions/%2541" },
    };

    const result = await $RefParser.dereference(schema);

    expect(result.value).toEqual({ type: "string" });
  });

  it.each(["%41", "%2F", "%25", "a b", "a/b", "a~b", "rate%", "a/b%"])(
    "preserves the property name %s through pointer creation, get, set, and dereference",
    async (key) => {
      const target = { type: "string" };
      const pointer = Pointer.join("#/definitions", key);
      const schema = { definitions: { [key]: target }, value: { $ref: pointer } };
      const refs = await $RefParser.resolve(schema);

      expect(Pointer.parse(pointer)).toEqual(["definitions", key]);
      expect(refs.get(pointer)).toBe(target);
      refs.set(Pointer.join(pointer, "title"), "Updated");
      expect(refs.get(Pointer.join(pointer, "title"))).toBe("Updated");

      const result = await $RefParser.dereference(schema);
      expect(result.value).toBe(target);
    },
  );

  it("preserves percent escapes through an indirect reference", async () => {
    const schema = {
      definitions: { "%41": { type: "string" }, A: { type: "number" } },
      alias: { $ref: "#/definitions/%2541" },
      value: { $ref: "#/alias" },
    };

    const result = await $RefParser.dereference(schema);

    expect(result.value).toBe(result.definitions["%41"]);
  });

  it("keeps bundled percent-containing references usable", async () => {
    const schema = {
      definitions: { "%41": { type: "string" }, A: { type: "number" } },
      value: { $ref: "#/definitions/%2541" },
    };

    const bundled = await $RefParser.bundle(schema);
    const result = await $RefParser.dereference(bundled);

    expect(result.value).toBe(result.definitions["%41"]);
  });

  it.each(["a b", "雪", "%41", "a/b"])("detects circular references at the key %s", async (key) => {
    const targetPath = Pointer.join("#/definitions", key);
    const createSchema = () => ({
      definitions: { [key]: { type: "object", properties: { self: { $ref: targetPath } } } },
      alias: { $ref: "#/definitions" },
      value: { $ref: Pointer.join("#/alias", key) },
    });
    const parser = new $RefParser();
    const result = await parser.dereference(createSchema());

    expect(parser.$refs.circular).toBe(true);
    expect(result.value).toBe(result.definitions[key]);
    expect(result.value.properties.self).toBe(result.value);
    await expect($RefParser.dereference(createSchema(), { dereference: { circular: false } })).rejects.toBeInstanceOf(
      ReferenceError,
    );
  });
});
