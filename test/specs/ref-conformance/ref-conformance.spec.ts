import { describe, expect, it } from "vitest";
import type { FileInfo } from "../../../lib/index.js";
import $RefParser from "../../../lib/index.js";
import type { ParserOptions } from "../../../lib/options.js";

const isBrowser = typeof window !== "undefined";
const isWindows = /^win/.test(globalThis.process ? globalThis.process.platform : "");

function createHttpResolver(remotes: Record<string, unknown>) {
  return {
    order: 1,
    canRead: /^https?:\/\//i,
    safeUrlResolver: false,
    read(file: FileInfo) {
      const remote = remotes[file.url];
      if (remote === undefined) {
        throw new Error(`Unexpected remote URL: ${file.url}`);
      }

      return structuredClone(remote);
    },
  };
}

async function dereferenceWithRemotes(schema: unknown, remotes: Record<string, unknown>) {
  const parser = new $RefParser();
  const result = await parser.dereference(structuredClone(schema as object), {
    resolve: {
      http: createHttpResolver(remotes),
    },
  } as ParserOptions);

  return { parser, result };
}

describe("Adapted $ref conformance scenarios", () => {
  describe("adapted from JSON Schema Test Suite tests/draft2020-12/ref.json", () => {
    it("should resolve $id against the nearest parent scope", async () => {
      // Adapted from ref.json: "$id must be resolved against nearest parent, not just immediate parent"
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "http://example.com/a.json",
        $defs: {
          x: {
            $id: "http://example.com/b/c.json",
            not: {
              $defs: {
                y: {
                  $id: "d.json",
                  type: "number",
                },
              },
            },
          },
        },
        allOf: [
          {
            $ref: "http://example.com/b/d.json",
          },
        ],
      };

      const result = await $RefParser.dereference(structuredClone(schema));

      expect((result as any).allOf[0]).toBe((result as any).$defs.x.not.$defs.y);
      expect((result as any).allOf[0]).toMatchObject({ type: "number" });
    });

    it("should evaluate $id before root-level $ref", async () => {
      // Adapted from ref.json: "order of evaluation: $id and $ref"
      const schema = {
        $comment: "$id must be evaluated before $ref to get the proper $ref destination",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "https://example.com/draft2020-12/ref-and-id1/base.json",
        $ref: "int.json",
        $defs: {
          bigint: {
            $comment: "canonical uri: https://example.com/ref-and-id1/int.json",
            $id: "int.json",
            maximum: 10,
          },
          smallint: {
            $comment: "canonical uri: https://example.com/ref-and-id1-int.json",
            $id: "/draft2020-12/ref-and-id1-int.json",
            maximum: 2,
          },
        },
      };

      const result = await $RefParser.dereference(structuredClone(schema));

      expect((result as any).maximum).toBe(10);
      expect((result as any).$defs.bigint.maximum).toBe(10);
      expect((result as any).$defs.smallint.maximum).toBe(2);
    });

    it("should resolve file URI pointers on non-Windows Node runtimes", async () => {
      // Adapted from ref.json: "$id with file URI still resolves pointers - *nix"
      if (isBrowser || isWindows) {
        return;
      }

      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "file:///folder/file.json",
        $defs: {
          foo: {
            type: "number",
          },
        },
        $ref: "#/$defs/foo",
      };

      const result = await $RefParser.dereference(structuredClone(schema));

      expect((result as any).type).toBe("number");
    });

    it("should resolve empty tokens inside JSON Pointer segments", async () => {
      // Adapted from ref.json: "empty tokens in $ref json-pointer"
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $defs: {
          "": {
            $defs: {
              "": {
                type: "number",
              },
            },
          },
        },
        allOf: [
          {
            $ref: "#/$defs//$defs/",
          },
        ],
      };

      const result = await $RefParser.dereference(structuredClone(schema));

      expect((result as any).allOf[0]).toBe((result as any).$defs[""].$defs[""]);
      expect((result as any).allOf[0].type).toBe("number");
    });
  });

  describe("adapted from JSON Schema Test Suite tests/draft2020-12/refRemote.json", () => {
    it("should follow base URI changes in nested item scopes", async () => {
      // Adapted from refRemote.json: "base URI change"
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "http://localhost:1234/draft2020-12/",
        items: {
          $id: "baseUriChange/",
          items: {
            $ref: "folderInteger.json",
          },
        },
      };

      const { result } = await dereferenceWithRemotes(schema, {
        "http://localhost:1234/draft2020-12/baseUriChange/folderInteger.json": {
          type: "integer",
        },
      });

      expect((result as any).items.items).toMatchObject({ type: "integer" });
    });

    it("should resolve refs against a folder-changing $id in $defs", async () => {
      // Adapted from refRemote.json: "base URI change - change folder"
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "http://localhost:1234/draft2020-12/scope_change_defs1.json",
        type: "object",
        properties: {
          list: {
            $ref: "baseUriChangeFolder/",
          },
        },
        $defs: {
          baz: {
            $id: "baseUriChangeFolder/",
            type: "array",
            items: {
              $ref: "folderInteger.json",
            },
          },
        },
      };

      const { result } = await dereferenceWithRemotes(schema, {
        "http://localhost:1234/draft2020-12/baseUriChangeFolder/folderInteger.json": {
          type: "integer",
        },
      });

      expect((result as any).properties.list).toBe((result as any).$defs.baz);
      expect((result as any).properties.list.items).toMatchObject({ type: "integer" });
    });

    it("should resolve refs against folder-changing $id scopes inside subschemas", async () => {
      // Adapted from refRemote.json: "base URI change - change folder in subschema"
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "http://localhost:1234/draft2020-12/scope_change_defs2.json",
        type: "object",
        properties: {
          list: {
            $ref: "baseUriChangeFolderInSubschema/#/$defs/bar",
          },
        },
        $defs: {
          baz: {
            $id: "baseUriChangeFolderInSubschema/",
            $defs: {
              bar: {
                type: "array",
                items: {
                  $ref: "folderInteger.json",
                },
              },
            },
          },
        },
      };

      const { result } = await dereferenceWithRemotes(schema, {
        "http://localhost:1234/draft2020-12/baseUriChangeFolderInSubschema/folderInteger.json": {
          type: "integer",
        },
      });

      expect((result as any).properties.list).toBe((result as any).$defs.baz.$defs.bar);
      expect((result as any).properties.list.items).toMatchObject({ type: "integer" });
    });

    it("should dereference root refs embedded inside remote definitions", async () => {
      // Adapted from refRemote.json: "root ref in remote ref"
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "http://localhost:1234/draft2020-12/object",
        type: "object",
        properties: {
          name: {
            $ref: "name-defs.json#/$defs/orNull",
          },
        },
      };

      const { parser, result } = await dereferenceWithRemotes(schema, {
        "http://localhost:1234/draft2020-12/name-defs.json": {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $defs: {
            orNull: {
              anyOf: [{ type: "null" }, { $ref: "#" }],
            },
          },
          type: "string",
        },
      });

      const orNull = (result as any).properties.name;
      const remoteRoot = orNull.anyOf[1];

      expect(parser.$refs.circular).toBe(true);
      expect(remoteRoot.type).toBe("string");
      expect(remoteRoot.$defs.orNull).toBe(orNull);
    });

    it("should dereference remote documents that immediately ref into their own $defs", async () => {
      // Adapted from refRemote.json: "remote ref with ref to defs"
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "http://localhost:1234/draft2020-12/schema-remote-ref-ref-defs1.json",
        $ref: "ref-and-defs.json",
      };

      const { result } = await dereferenceWithRemotes(schema, {
        "http://localhost:1234/draft2020-12/ref-and-defs.json": {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "http://localhost:1234/draft2020-12/ref-and-defs.json",
          $defs: {
            inner: {
              properties: {
                bar: { type: "string" },
              },
            },
          },
          $ref: "#/$defs/inner",
        },
      });

      expect((result as any).properties.bar).toMatchObject({ type: "string" });
      expect((result as any).$defs.inner.properties.bar).toMatchObject({ type: "string" });
    });

    it("should resolve nested remote refs relative to the retrieved document URI", async () => {
      // Adapted from refRemote.json: "retrieved nested refs resolve relative to their URI not $id"
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "http://localhost:1234/draft2020-12/some-id",
        properties: {
          name: {
            $ref: "nested/foo-ref-string.json",
          },
        },
      };

      const { result } = await dereferenceWithRemotes(schema, {
        "http://localhost:1234/draft2020-12/nested/foo-ref-string.json": {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {
            foo: {
              $ref: "string.json",
            },
          },
        },
        "http://localhost:1234/draft2020-12/nested/string.json": {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "string",
        },
      });

      expect((result as any).properties.name.properties.foo).toMatchObject({ type: "string" });
    });
  });
});
