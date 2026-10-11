import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

const root = "https://example.com/source/root.json";
const target = "https://example.com/target/schema.json";

function options(documents: Record<string, object>) {
  return {
    resolve: {
      file: false as const,
      http: false as const,
      memory: {
        canRead: true,
        read(file: { url: string }) {
          if (!Object.hasOwn(documents, file.url)) {
            throw new Error(`Unexpected document: ${file.url}`);
          }
          return structuredClone(documents[file.url]);
        },
      },
    },
  };
}

describe("extended reference sibling scopes", () => {
  it.each([false, true])("keeps source and inherited nested scopes (cached: %s)", async (cached) => {
    const result = await $RefParser.dereference(
      root,
      {
        ...(cached ? { plain: { $ref: target } } : {}),
        extended: { $ref: target, properties: { sibling: { $ref: "child.json" } } },
      },
      options({
        [target]: { properties: { inherited: { $ref: "child.json" } } },
        "https://example.com/source/child.json": { type: "number" },
        "https://example.com/target/child.json": { type: "string" },
      }),
    );

    expect(result.extended.properties).toEqual({ sibling: { type: "number" }, inherited: { type: "string" } });
  });

  it("keeps siblings of a cached circular target in the source document", async () => {
    const result = await $RefParser.dereference(
      root,
      {
        plain: { $ref: target },
        extended: { $ref: target, sibling: { $ref: "child.json" } },
      },
      {
        ...options({
          [target]: { properties: { self: { $ref: target } } },
          "https://example.com/source/child.json": { type: "number" },
        }),
        dereference: { cloneReferences: true },
      },
    );

    expect(result.extended.sibling).toEqual({ type: "number" });
    expect(result.extended.properties.self).toBe(result.plain);
  });

  it("preserves each origin through a chain of extended references", async () => {
    const intermediate = "https://example.com/intermediate/schema.json";
    const result = await $RefParser.dereference(
      root,
      { extended: { $ref: intermediate, properties: { source: { $ref: "child.json" } } } },
      options({
        [intermediate]: { $ref: target, properties: { intermediate: { $ref: "child.json" } } },
        [target]: { properties: { inherited: { $ref: "child.json" } } },
        "https://example.com/source/child.json": { type: "number" },
        "https://example.com/intermediate/child.json": { type: "boolean" },
        "https://example.com/target/child.json": { type: "string" },
      }),
    );

    expect(result.extended.properties).toEqual({
      source: { type: "number" },
      intermediate: { type: "boolean" },
      inherited: { type: "string" },
    });
  });

  it.each([
    ["https://json-schema.org/draft/2020-12/schema", "$id"],
    ["http://json-schema.org/draft-04/schema#", "id"],
  ])("keeps nested source and target identifier scopes separate (%s)", async ($schema, keyword) => {
    const result = await $RefParser.dereference(
      root,
      {
        $schema,
        extended: {
          $ref: target,
          properties: {
            config: { [keyword]: "source-scope/", source: { $ref: "child.json" } },
          },
        },
      },
      options({
        [target]: {
          $schema,
          properties: {
            config: { [keyword]: "target-scope/", inherited: { $ref: "child.json" } },
          },
        },
        "https://example.com/source/source-scope/child.json": { type: "number" },
        "https://example.com/target/target-scope/child.json": { type: "string" },
      }),
    );

    expect(result.extended.properties.config.source).toEqual({ type: "number" });
    expect(result.extended.properties.config.inherited).toEqual({ type: "string" });
  });

  it("keeps sibling provenance when a merged child inherits another reference", async () => {
    const result = await $RefParser.dereference(
      root,
      {
        extended: {
          $ref: target,
          properties: { config: { properties: { source: { $ref: "child.json" } } } },
        },
      },
      options({
        [target]: { properties: { config: { $ref: "details.json" } } },
        "https://example.com/target/details.json": { properties: { inherited: { $ref: "child.json" } } },
        "https://example.com/source/child.json": { type: "number" },
        "https://example.com/target/child.json": { type: "string" },
      }),
    );

    expect(result.extended.properties.config.properties).toEqual({
      source: { type: "number" },
      inherited: { type: "string" },
    });
  });

  it("preserves origins while walking a pointer through an extended reference", async () => {
    const parser = new $RefParser();
    await parser.resolve(
      root,
      { extended: { $ref: target, properties: { source: { $ref: "child.json" } } } },
      options({
        [target]: { properties: { inherited: { $ref: "child.json" } } },
        "https://example.com/source/child.json": { type: "number" },
        "https://example.com/target/child.json": { type: "string" },
      }),
    );

    expect(parser.$refs.get("#/extended/properties/source")).toEqual({ type: "number" });
    expect(parser.$refs.get("#/extended/properties/inherited")).toEqual({ type: "string" });
  });

  it("leaves excluded sibling references unchanged", async () => {
    const ignored = { $ref: "unavailable.json" };
    const excludedPathMatcher = (path: string) => path.endsWith("/ignored");
    const resolverOptions = options({
      [target]: { inherited: { $ref: "child.json" } },
      "https://example.com/source/child.json": { type: "number" },
      "https://example.com/target/child.json": { type: "string" },
    });
    const result = await $RefParser.dereference(
      root,
      { extended: { $ref: target, ignored, sibling: { $ref: "child.json" } } },
      {
        ...resolverOptions,
        resolveExcludedPathMatcher: excludedPathMatcher,
        dereference: { excludedPathMatcher },
      },
    );

    expect(result.extended.ignored).toBe(ignored);
    expect(ignored).toEqual({ $ref: "unavailable.json" });
    expect(result.extended.sibling).toEqual({ type: "number" });
    expect(result.extended.inherited).toEqual({ type: "string" });
  });

  it("does not inspect an overridden target accessor when merging is disabled", async () => {
    const base = {
      get field(): unknown {
        throw new Error("Overridden accessor was read");
      },
    };
    const excludedPathMatcher = (path: string) => path === "#/target";
    const result = await $RefParser.dereference(
      {
        target: base,
        value: { $ref: "#/target", field: { own: true } },
      },
      {
        resolveExcludedPathMatcher: excludedPathMatcher,
        dereference: {
          mergeKeys: false,
          excludedPathMatcher,
        },
      },
    );

    expect(result.value.field).toEqual({ own: true });
  });
});
