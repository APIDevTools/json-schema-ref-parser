import { describe, expect, it } from "vitest";
import $RefParser, { MissingPointerError } from "../../../lib/index.js";

describe("JSON pointer own properties", () => {
  it.each(["constructor", "toString", "__proto__"])("does not resolve inherited %s", async (key) => {
    const refs = await $RefParser.resolve({});

    expect(refs.exists(`#/${key}`)).toBe(false);
    expect(() => refs.get(`#/${key}`)).toThrow(MissingPointerError);
    await expect($RefParser.dereference({ value: { $ref: `#/${key}` } })).rejects.toThrow(MissingPointerError);
  });

  it("resolves explicitly defined properties with names shared by Object.prototype", async () => {
    const schema = JSON.parse('{"constructor":{"type":"string"},"toString":false,"__proto__":null}');
    const refs = await $RefParser.resolve(schema);

    expect(refs.get("#/constructor")).toBe(schema.constructor);
    expect(refs.get("#/toString")).toBe(false);
    expect(refs.get("#/__proto__")).toBe(null);
  });

  it("does not resolve inherited null values or slash-containing properties", async () => {
    const schema = Object.create({ missing: null, "missing/child": { type: "string" } });
    const refs = await $RefParser.resolve(schema);

    expect(refs.exists("#/missing")).toBe(false);
    expect(refs.exists("#/missing/child")).toBe(false);
  });

  it("creates an own parent when setting a path with an inherited parent", async () => {
    const inherited = { type: "string" };
    const schema = Object.create({ properties: inherited });
    const refs = await $RefParser.resolve(schema);

    refs.set("#/properties/title", "Example");

    expect(Object.hasOwn(schema, "properties")).toBe(true);
    expect(schema.properties).toEqual({ title: "Example" });
    expect(inherited).toEqual({ type: "string" });
  });
});
