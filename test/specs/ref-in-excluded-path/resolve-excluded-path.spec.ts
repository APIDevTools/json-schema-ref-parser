import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import type { FileInfo, ParserOptions } from "../../../lib/index.js";

type DocumentMap = Record<string, object>;

function memoryOptions(
  documents: DocumentMap,
  reads: Record<string, number>,
  matcher?: (path: string, value?: unknown) => boolean,
): ParserOptions {
  return {
    ...(matcher ? { resolveExcludedPathMatcher: matcher } : {}),
    resolve: {
      file: false,
      http: false,
      memory: {
        canRead: /^mem:/,
        async read(file: FileInfo) {
          reads[file.url] = (reads[file.url] || 0) + 1;
          await Promise.resolve();
          const document = documents[file.url];
          if (!document) {
            throw new Error(`Unexpected memory URL: ${file.url}`);
          }
          return document;
        },
      },
    },
  };
}

function isReference(value: unknown): value is { $ref: string } {
  return Boolean(value) && typeof value === "object" && "$ref" in value && typeof value.$ref === "string";
}

describe("excluded paths during resolution", () => {
  it("does not fetch a literal external $ref while resolving a neighboring structural reference", async () => {
    const reads: Record<string, number> = {};
    const schema = {
      definitions: {
        user: { type: "object" },
      },
      example: {
        internal: { $ref: "#/definitions/user" },
        manager: {
          $ref: "mem://literal-manager.json",
          value: "789012",
          displayName: "Jane Manager",
        },
      },
    };
    const matcher = (schemaPath: string, value?: unknown) =>
      schemaPath === "#/example/manager" && isReference(value) && "value" in value;
    const options = memoryOptions({}, reads, matcher);
    options.dereference = { excludedPathMatcher: matcher };

    const dereferenced = await $RefParser.dereference("mem://root.json", schema, options);

    expect(dereferenced.example.internal).toEqual({ type: "object" });
    expect(dereferenced.example.manager).toEqual(schema.example.manager);
    expect(reads["mem://literal-manager.json"]).toBeUndefined();
  });

  it("mounts an external fragment at the referring root-relative path", async () => {
    const reads: Record<string, number> = {};
    const seenPaths: string[] = [];
    const matcher = (schemaPath: string, value?: unknown) => {
      seenPaths.push(schemaPath);
      return schemaPath === "#/wrapper/example" && isReference(value);
    };
    const options = memoryOptions(
      {
        "mem://external.json": {
          payload: {
            example: { $ref: "mem://literal.json" },
            structural: { type: "string" },
          },
        },
      },
      reads,
      matcher,
    );

    await $RefParser.resolve(
      "mem://root.json",
      {
        wrapper: { $ref: "mem://external.json#/payload" },
      },
      options,
    );

    expect(reads["mem://external.json"]).toBe(1);
    expect(reads["mem://literal.json"]).toBeUndefined();
    expect(seenPaths).toContain("#/wrapper/example");
    expect(seenPaths).not.toContain("#/wrapper/payload/example");
  });

  it("follows intermediate references while selecting an external fragment", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      {
        "mem://external.json": {
          alias: { $ref: "#/target" },
          target: {
            child: { $ref: "mem://nested.json" },
          },
        },
        "mem://nested.json": { type: "string" },
      },
      reads,
    );

    await $RefParser.resolve(
      "mem://root.json",
      {
        wrapper: { $ref: "mem://external.json#/alias/child" },
      },
      options,
    );

    expect(reads["mem://external.json"]).toBe(1);
    expect(reads["mem://nested.json"]).toBe(1);
  });

  it("evaluates every shared-document occurrence independently of key order", async () => {
    for (const order of [
      ["first", "second"],
      ["second", "first"],
    ] as const) {
      const reads: Record<string, number> = {};
      const schema = Object.fromEntries(order.map((key) => [key, { $ref: "mem://shared.json" }]));
      const options = memoryOptions(
        {
          "mem://shared.json": {
            literal: { $ref: "mem://nested.json" },
          },
          "mem://nested.json": { type: "number" },
        },
        reads,
        (schemaPath) => schemaPath === "#/second/literal",
      );

      await $RefParser.resolve("mem://root.json", schema, options);

      expect(reads["mem://shared.json"]).toBe(1);
      expect(reads["mem://nested.json"]).toBe(1);
    }
  });

  it("does not discover a nested reference when all shared-document occurrences exclude it", async () => {
    for (const order of [
      ["first", "second"],
      ["second", "first"],
    ] as const) {
      const reads: Record<string, number> = {};
      const schema = Object.fromEntries(order.map((key) => [key, { $ref: "mem://shared.json" }]));
      const options = memoryOptions(
        {
          "mem://shared.json": {
            literal: { $ref: "mem://nested.json" },
          },
        },
        reads,
        (schemaPath) => schemaPath.endsWith("/literal"),
      );

      await $RefParser.resolve("mem://root.json", schema, options);

      expect(reads["mem://shared.json"]).toBe(1);
      expect(reads["mem://nested.json"]).toBeUndefined();
    }
  });

  it("treats a nonexcluded internal alias as a fresh logical occurrence", async () => {
    for (const order of [
      ["source", "alias"],
      ["alias", "source"],
    ] as const) {
      const reads: Record<string, number> = {};
      const values = {
        source: { nested: { $ref: "mem://nested.json" } },
        alias: { $ref: "#/source" },
      };
      const schema = Object.fromEntries(order.map((key) => [key, values[key]]));
      const options = memoryOptions(
        { "mem://nested.json": { type: "string" } },
        reads,
        (schemaPath) => schemaPath === "#/source",
      );

      await $RefParser.resolve("mem://root.json", schema, options);

      expect(reads["mem://nested.json"]).toBe(1);
    }
  });

  it("keeps extended-alias siblings independent from excluded targets", async () => {
    const reads: Record<string, number> = {};
    const matcher = (schemaPath: string, value?: unknown) =>
      schemaPath === "#/target" ||
      schemaPath === "#/structuralTarget" ||
      (isReference(value) && value.$ref === "mem://literal.json");
    const options = memoryOptions(
      {
        "mem://literal.json": { literal: true },
        "mem://structural.json": { type: "integer" },
      },
      reads,
      matcher,
    );
    const schema = {
      target: { inherited: { $ref: "mem://literal.json" } },
      structuralTarget: { nested: { $ref: "mem://structural.json" } },
      use: {
        $ref: "#/target",
        structural: { $ref: "#/structuralTarget" },
      },
    };

    await $RefParser.resolve("mem://root.json", schema, options);

    expect(reads["mem://literal.json"]).toBeUndefined();
    expect(reads["mem://structural.json"]).toBe(1);
  });

  it("evaluates a deep-merged value once while retaining each child's URI scope", async () => {
    const reads: Record<string, number> = {};
    const matcher = (schemaPath: string, value?: unknown) =>
      schemaPath === "#/use/config" &&
      Boolean(value) &&
      typeof value === "object" &&
      "target" in value &&
      "literal" in value;
    const options = memoryOptions(
      {
        "mem://external.json": {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          target: {
            $id: "mem://target-scope/",
            config: {
              target: true,
              nested: { $ref: "unexpected.json" },
            },
            inherited: { $ref: "inherited.json" },
          },
        },
        "mem://target-scope/inherited.json": { type: "number" },
        "mem://root-scope/sibling.json": { type: "string" },
      },
      reads,
      (schemaPath, value) => schemaPath === "#/target" || matcher(schemaPath, value),
    );

    await $RefParser.resolve(
      "mem://retrieval.json",
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "mem://root-scope/",
        target: { ignored: true },
        use: {
          $ref: "mem://external.json#/target",
          config: { literal: true },
          sibling: { $ref: "sibling.json" },
        },
      },
      options,
    );

    expect(reads["mem://external.json"]).toBe(1);
    expect(reads["mem://target-scope/inherited.json"]).toBe(1);
    expect(reads["mem://root-scope/sibling.json"]).toBe(1);
    expect(reads["mem://target-scope/unexpected.json"]).toBeUndefined();
  });

  it("keeps URI scope local when shared objects are merged at sibling occurrences", async () => {
    const reads: Record<string, number> = {};
    const targetShared = { nested: { $ref: "nested.json" } };
    const sourceShared = { own: true };
    const options = memoryOptions(
      {
        "mem://a/nested.json": { type: "string" },
        "mem://b/nested.json": { type: "number" },
      },
      reads,
      (schemaPath) => schemaPath === "#/target",
    );

    await $RefParser.resolve(
      "mem://root.json",
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        target: {
          a: { $id: "mem://a/", group: targetShared },
          b: { $id: "mem://b/", group: targetShared },
        },
        use: {
          $ref: "#/target",
          a: { group: sourceShared },
          b: { group: sourceShared },
        },
      },
      options,
    );

    expect(reads["mem://a/nested.json"]).toBe(1);
    expect(reads["mem://b/nested.json"]).toBe(1);
  });

  it("applies mergeKeys when determining whether a target branch remains reachable", async () => {
    for (const [mergeKeys, expectedReads] of [
      [true, 1],
      [false, 0],
    ] as const) {
      const reads: Record<string, number> = {};
      const options = memoryOptions(
        { "mem://nested.json": { type: "string" } },
        reads,
        (schemaPath) => schemaPath === "#/target",
      );
      options.dereference = { mergeKeys };

      await $RefParser.resolve(
        "mem://root.json",
        {
          target: { config: { nested: { $ref: "mem://nested.json" } } },
          use: { $ref: "#/target", config: { own: true } },
        },
        options,
      );

      expect(reads["mem://nested.json"] || 0).toBe(expectedReads);
    }
  });

  it("revisits an excluded target through an alias registered by canonical $id", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      {
        "mem://retrieval.json": {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "mem://canonical.json",
          source: { nested: { $ref: "mem://nested.json" } },
          alias: { $ref: "#/source" },
        },
        "mem://nested.json": { type: "string" },
      },
      reads,
      (schemaPath) => schemaPath === "#/entry/source",
    );

    await $RefParser.resolve("mem://root.json", { entry: { $ref: "mem://retrieval.json" } }, options);

    expect(reads["mem://retrieval.json"]).toBe(1);
    expect(reads["mem://nested.json"]).toBe(1);
  });

  it("treats an alias to an ancestor as a fresh occurrence", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      { "mem://nested.json": { type: "string" } },
      reads,
      (schemaPath) => schemaPath === "#/literal",
    );

    await $RefParser.resolve(
      "mem://root.json",
      {
        literal: { nested: { $ref: "mem://nested.json" } },
        alias: { $ref: "#" },
      },
      options,
    );

    expect(reads["mem://nested.json"]).toBe(1);
  });

  it("does not inspect excluded or overridden accessors while constructing a merged occurrence", async () => {
    let excludedGetterCalls = 0;
    let overriddenGetterCalls = 0;
    const targetGroup = { target: true };
    Object.defineProperty(targetGroup, "danger", {
      enumerable: true,
      get() {
        excludedGetterCalls += 1;
        throw new Error("excluded merged child was evaluated");
      },
    });
    const target = { group: targetGroup };
    Object.defineProperty(target, "overridden", {
      enumerable: true,
      get() {
        overriddenGetterCalls += 1;
        throw new Error("overridden target child was evaluated");
      },
    });
    const options = memoryOptions({}, {}, (schemaPath, value) => {
      if (schemaPath === "#/target") {
        return true;
      }
      return schemaPath === "#/use/group" && Boolean(value) && typeof value === "object" && "marker" in value;
    });

    await $RefParser.resolve(
      "mem://root.json",
      {
        target,
        use: {
          $ref: "#/target",
          group: { marker: true },
          overridden: false,
        },
      },
      options,
    );

    expect(excludedGetterCalls).toBe(0);
    expect(overriddenGetterCalls).toBe(0);
  });

  it("matches dereference's plain-object result for an extended array reference", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      {
        "mem://array.json": [{ $ref: "mem://nested.json" }],
        "mem://nested.json": { type: "integer" },
      },
      reads,
      (schemaPath, value) => schemaPath === "#/use" && Array.isArray(value),
    );

    await $RefParser.resolve("mem://root.json", { use: { $ref: "mem://array.json", marker: true } }, options);

    expect(reads["mem://nested.json"]).toBe(1);
  });

  it("supports the pointer fallback for unescaped slash keys in external fragments", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      {
        "mem://external.json": {
          "a/b": { nested: { $ref: "mem://nested.json" } },
        },
        "mem://nested.json": { type: "boolean" },
      },
      reads,
      () => false,
    );

    await $RefParser.resolve("mem://root.json", { use: { $ref: "mem://external.json#/a/b" } }, options);

    expect(reads["mem://nested.json"]).toBe(1);
  });

  it("continues through siblings of an extended reference after a handled load error", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions({ "mem://ok.json": { type: "string" } }, reads, () => false);
    options.continueOnError = true;

    await $RefParser.resolve(
      "mem://root.json",
      {
        use: {
          $ref: "mem://missing.json",
          sibling: { $ref: "mem://ok.json" },
        },
      },
      options,
    );

    expect(reads["mem://ok.json"]).toBe(1);
  });

  it("crawls siblings of an extended self-reference without following the cycle", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions({ "mem://nested.json": { type: "number" } }, reads, () => false);

    await $RefParser.resolve(
      "mem://root.json",
      {
        self: {
          $ref: "#/self",
          nested: { $ref: "mem://nested.json" },
        },
      },
      options,
    );

    expect(reads["mem://nested.json"]).toBe(1);
  });

  it("checks direct child references during bundling", async () => {
    const reads: Record<string, number> = {};
    const bundledRefs: string[] = [];
    const matcher = (schemaPath: string, value?: unknown) => schemaPath === "#/blocked" && isReference(value);
    const options = memoryOptions(
      {
        "mem://blocked.json": { type: "boolean" },
        "mem://allowed.json": { type: "string" },
      },
      reads,
      matcher,
    );
    options.mutateInputSchema = false;
    options.bundle = {
      excludedPathMatcher: matcher,
      onBundle(reference) {
        bundledRefs.push(reference);
      },
    };
    const input = {
      blocked: { $ref: "mem://blocked.json" },
      allowed: { $ref: "mem://allowed.json" },
    };

    const bundled = await $RefParser.bundle("mem://root.json", input, options);

    expect(bundled).not.toBe(input);
    expect(bundled.blocked).toEqual({ $ref: "mem://blocked.json" });
    expect(bundled.allowed).toEqual({ type: "string" });
    expect(reads["mem://blocked.json"]).toBeUndefined();
    expect(bundledRefs).toEqual(["mem://allowed.json"]);
  });

  it("does not retain exclusions across parser calls", async () => {
    const reads: Record<string, number> = {};
    const documents = { "mem://external.json": { type: "string" } };
    const schema = { value: { $ref: "mem://external.json" } };
    const parser = new $RefParser();

    await parser.resolve(
      "mem://root.json",
      schema,
      memoryOptions(documents, reads, (schemaPath) => schemaPath === "#/value"),
    );
    expect(reads["mem://external.json"]).toBeUndefined();

    await parser.resolve("mem://root.json", schema, memoryOptions(documents, reads));
    expect(reads["mem://external.json"]).toBe(1);
  });

  it("revisits a shared cyclic object at a nonexcluded occurrence", async () => {
    for (const order of [
      ["excluded", "included"],
      ["included", "excluded"],
    ] as const) {
      const reads: Record<string, number> = {};
      const shared: Record<string, unknown> = {
        nested: { $ref: "mem://nested.json" },
      };
      shared.self = shared;
      const schema = Object.fromEntries(order.map((key) => [key, shared]));
      const options = memoryOptions(
        { "mem://nested.json": { type: "string" } },
        reads,
        (schemaPath) => schemaPath === "#/excluded",
      );

      await $RefParser.resolve("mem://root.json", schema, options);

      expect(reads["mem://nested.json"]).toBe(1);
    }
  });

  it("does not inspect descendants of an excluded container", async () => {
    let getterCalls = 0;
    const excluded = {};
    Object.defineProperty(excluded, "danger", {
      enumerable: true,
      get() {
        getterCalls += 1;
        throw new Error("excluded getter was evaluated");
      },
    });

    await $RefParser.resolve(
      "mem://root.json",
      { excluded },
      memoryOptions({}, {}, (schemaPath) => schemaPath === "#/excluded"),
    );

    expect(getterCalls).toBe(0);
  });

  it("lets path-only matchers shield direct accessor properties in every stage", async () => {
    for (const operation of ["resolve", "bundle", "dereference"] as const) {
      let getterCalls = 0;
      const schema = {};
      Object.defineProperty(schema, "danger", {
        enumerable: true,
        get() {
          getterCalls += 1;
          throw new Error(`${operation} evaluated an excluded getter`);
        },
      });
      const matcher = (schemaPath: string) => schemaPath === "#/danger";
      const options = memoryOptions({}, {}, matcher);
      options.bundle = { excludedPathMatcher: matcher };
      options.dereference = { excludedPathMatcher: matcher };

      if (operation === "resolve") {
        await $RefParser.resolve("mem://root.json", schema, options);
      } else if (operation === "bundle") {
        await $RefParser.bundle("mem://root.json", schema, options);
      } else {
        await $RefParser.dereference("mem://root.json", schema, options);
      }

      expect(getterCalls).toBe(0);
    }
  });

  it("retains full-document resolution when a matcher is absent or excludes nothing", async () => {
    for (const matcher of [undefined, () => false]) {
      const reads: Record<string, number> = {};
      const options = memoryOptions(
        {
          "mem://external.json": {
            used: { type: "string" },
            unused: { $ref: "mem://unused.json" },
          },
          "mem://unused.json": { type: "number" },
        },
        reads,
        matcher,
      );

      await $RefParser.resolve("mem://root.json", { use: { $ref: "mem://external.json#/used" } }, options);

      expect(reads["mem://unused.json"]).toBe(1);
    }
  });

  it("does not leak a selected exclusion across shared physical document occurrences", async () => {
    for (const order of [
      ["used", "unused"],
      ["unused", "used"],
    ] as const) {
      const reads: Record<string, number> = {};
      const shared = { nested: { $ref: "mem://nested.json" } };
      const external = Object.fromEntries(order.map((key) => [key, shared]));
      const options = memoryOptions(
        {
          "mem://external.json": external,
          "mem://nested.json": { type: "string" },
        },
        reads,
        (schemaPath) => schemaPath === "#/use/nested",
      );

      await $RefParser.resolve("mem://root.json", { use: { $ref: "mem://external.json#/used" } }, options);

      expect(reads["mem://nested.json"]).toBe(1);
    }
  });

  it("does not bypass exclusions by supplementing an internal alias target", async () => {
    for (const includeUnusedOccurrence of [false, true]) {
      const reads: Record<string, number> = {};
      const shared = { nested: { $ref: "mem://nested.json" } };
      const external = {
        target: shared,
        alias: { $ref: "#/target" },
        ...(includeUnusedOccurrence ? { unused: shared } : {}),
      };
      const options = memoryOptions(
        {
          "mem://external.json": external,
          "mem://nested.json": { type: "string" },
        },
        reads,
        (schemaPath) => schemaPath === "#/use/nested",
      );

      await $RefParser.resolve("mem://root.json", { use: { $ref: "mem://external.json#/alias" } }, options);

      expect(reads["mem://nested.json"] || 0).toBe(includeUnusedOccurrence ? 1 : 0);
    }
  });

  it("does not treat a canonical alias of the root as an external document", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      { "mem://literal.json": { type: "string" } },
      reads,
      (schemaPath) => schemaPath === "#/blocked",
    );

    await $RefParser.resolve(
      "mem://retrieval.json",
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "mem://canonical.json",
        blocked: { $ref: "mem://literal.json" },
        target: { type: "string" },
        use: { $ref: "mem://canonical.json#/target" },
      },
      options,
    );

    expect(reads["mem://literal.json"]).toBeUndefined();
  });

  it("maps canonical aliases back to their physical external occurrences", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      {
        "mem://retrieval.json": {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "mem://canonical.json",
          entry: { $ref: "mem://canonical.json#/selected" },
          selected: { blocked: { $ref: "mem://literal.json" } },
        },
        "mem://literal.json": { type: "string" },
      },
      reads,
      (schemaPath) => schemaPath === "#/use/blocked",
    );

    await $RefParser.resolve("mem://root.json", { use: { $ref: "mem://retrieval.json#/entry" } }, options);

    expect(reads["mem://retrieval.json"]).toBe(1);
    expect(reads["mem://literal.json"]).toBeUndefined();
  });

  it("retains unmounted siblings of an intermediate alias target", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      {
        "mem://external.json": {
          alias: { $ref: "#/target" },
          target: {
            selected: { type: "string" },
            unused: { $ref: "mem://unused.json" },
          },
        },
        "mem://unused.json": { type: "number" },
      },
      reads,
      () => false,
    );

    await $RefParser.resolve("mem://root.json", { use: { $ref: "mem://external.json#/alias/selected" } }, options);

    expect(reads["mem://unused.json"]).toBe(1);
  });

  it("retains raw target inventory when an extended reference overrides a branch", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      {
        "mem://external.json": {
          overridden: { nested: { $ref: "mem://nested.json" } },
        },
        "mem://nested.json": { type: "boolean" },
      },
      reads,
      () => false,
    );

    await $RefParser.resolve(
      "mem://root.json",
      {
        use: {
          $ref: "mem://external.json",
          overridden: false,
        },
      },
      options,
    );

    expect(reads["mem://nested.json"]).toBe(1);
  });

  it("excludes every physical origin of a matched overridden branch", async () => {
    const reads: Record<string, number> = {};
    const options = memoryOptions(
      {
        "mem://external.json": {
          overridden: { nested: { $ref: "mem://nested.json" } },
        },
      },
      reads,
      (schemaPath) => schemaPath === "#/use/overridden",
    );

    await $RefParser.resolve(
      "mem://root.json",
      {
        use: {
          $ref: "mem://external.json",
          overridden: false,
        },
      },
      options,
    );

    expect(reads["mem://nested.json"]).toBeUndefined();
  });

  it("does not inspect excluded accessors while supplementing a physical document", async () => {
    let getterCalls = 0;
    const external = {};
    Object.defineProperty(external, "danger", {
      enumerable: true,
      get() {
        getterCalls += 1;
        throw new Error("excluded external getter was evaluated");
      },
    });
    const options = memoryOptions(
      { "mem://external.json": external },
      {},
      (schemaPath) => schemaPath === "#/use/danger",
    );

    await $RefParser.resolve("mem://root.json", { use: { $ref: "mem://external.json", danger: false } }, options);

    expect(getterCalls).toBe(0);
  });

  it("rejects a nested matcher instead of silently treating it as a resolver plugin", async () => {
    const options = memoryOptions({}, {});
    (options.resolve as Record<string, unknown>).excludedPathMatcher = () => true;

    await expect($RefParser.resolve("mem://root.json", {}, options)).rejects.toThrow(
      "Use the top-level resolveExcludedPathMatcher option",
    );
  });
});
