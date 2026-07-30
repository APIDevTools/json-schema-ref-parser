import { describe, expect, it } from "vitest";
import $RefParser, { InvalidPointerError, MissingPointerError, ParserError } from "../../lib/index.js";
import binaryParser from "../../lib/parsers/binary.js";
import jsonParser from "../../lib/parsers/json.js";
import textParser from "../../lib/parsers/text.js";

describe("core regressions", () => {
  describe("boolean schemas", () => {
    it("accepts false and true through every public operation", async () => {
      const parsed: boolean = await $RefParser.parse(false);
      const bundled: boolean = await $RefParser.bundle(false);
      const dereferenced: boolean = await $RefParser.dereference(true);
      const $refs = await $RefParser.resolve(false);

      expect(parsed).toBe(false);
      expect(bundled).toBe(false);
      expect(dereferenced).toBe(true);
      expect($refs.get($refs.paths()[0])).toBe(false);
    });
  });

  describe("JSON pointers", () => {
    it("reports a missing pointer when traversal reaches a primitive", async () => {
      await expect(
        $RefParser.dereference({
          definitions: { answer: 42 },
          use: { $ref: "#/definitions/answer/value" },
        } as any),
      ).rejects.toBeInstanceOf(MissingPointerError);
    });

    it("resolves property names containing a literal percent sign", async () => {
      const result = (await $RefParser.dereference({
        definitions: { "rate%": { type: "number" } },
        use: { $ref: "#/definitions/rate%" },
      })) as any;

      expect(result.use).toEqual({ type: "number" });
    });

    it("uses the invalid-pointer error code", () => {
      expect(new InvalidPointerError("bad", "schema.json#bad").code).toBe("EINVALIDPOINTER");
    });
  });

  describe("plugin execution", () => {
    it("waits for an asynchronous callback from the only parser", async () => {
      const result = await $RefParser.parse("memory://schema.json", {
        resolve: {
          file: false,
          http: false,
          memory: {
            canRead: /^memory:/,
            read: "ignored",
          },
        },
        parse: {
          json: false,
          yaml: false,
          text: false,
          binary: false,
          delayed: {
            canParse: true,
            parse(_file: unknown, callback: (error: Error | null, value: object) => void) {
              setTimeout(() => callback(null, { selected: "callback" }), 0);
            },
          },
        },
      } as any);

      expect(result).toEqual({ selected: "callback" });
    });

    it("waits for an asynchronous callback from the only resolver", async () => {
      const result = await $RefParser.parse("memory://schema.json", {
        resolve: {
          file: false,
          http: false,
          memory: {
            canRead: /^memory:/,
            read(_file: unknown, callback: (error: Error | null, value: string) => void) {
              setTimeout(() => callback(null, '{"selected":"callback"}'), 0);
            },
          },
        },
      } as any);

      expect(result).toEqual({ selected: "callback" });
    });

    it("preserves order zero as the highest-priority parser", async () => {
      const result = await $RefParser.parse("memory://schema.data", {
        resolve: {
          file: false,
          http: false,
          memory: { canRead: true, read: "ignored" },
        },
        parse: {
          json: false,
          yaml: false,
          text: false,
          binary: false,
          first: { order: 0, canParse: true, parse: { selected: 0 } },
          second: { order: 1, canParse: true, parse: { selected: 1 } },
        },
      } as any);

      expect(result).toEqual({ selected: 0 });
    });

    it("resets global regular expressions between referenced files", async () => {
      const documents: Record<string, object> = {
        "memory://one.json": { type: "string" },
        "memory://two.json": { type: "number" },
      };
      const result = (await $RefParser.dereference(
        "memory://root.json",
        {
          one: { $ref: "memory://one.json" },
          two: { $ref: "memory://two.json" },
        },
        {
          resolve: {
            file: false,
            http: false,
            memory: {
              canRead: /^memory:/g,
              read(file: { url: string }) {
                return structuredClone(documents[file.url]);
              },
            },
          },
        } as any,
      )) as any;

      expect(result.one).toEqual({ type: "string" });
      expect(result.two).toEqual({ type: "number" });
    });
  });

  describe("built-in parsers", () => {
    const parseJson = jsonParser.parse as (file: { url: string; data: string }) => Promise<unknown>;

    it("strips only a leading BOM and parses every JSON value shape", async () => {
      await expect(parseJson.call(jsonParser, { url: "array.json", data: "\uFEFF[1,2]" })).resolves.toEqual([1, 2]);
      await expect(parseJson.call(jsonParser, { url: "boolean.json", data: "\uFEFFfalse" })).resolves.toBe(false);
    });

    it("does not accept arbitrary junk before a JSON object", async () => {
      await expect(
        parseJson.call(jsonParser, { url: "junk.json", data: 'junk {"valid":true}' }),
      ).rejects.toBeInstanceOf(ParserError);
    });

    it("matches text and binary extensions before a query string", () => {
      expect((textParser.canParse as any)({ url: "asset.txt?download=1", data: "text" })).toBe(true);
      expect((binaryParser.canParse as any)({ url: "image.png?download=1", data: Buffer.from([1]) })).toBe(true);
    });
  });

  describe("schema identifier scopes", () => {
    it.each([
      {
        name: "draft-04 id",
        schema: {
          $schema: "http://json-schema.org/draft-04/schema#",
          id: "scoped/",
          child: { $ref: "child.json" },
        },
      },
      {
        name: "draft-07 $id",
        schema: {
          $schema: "http://json-schema.org/draft-07/schema#",
          $id: "scoped/",
          child: { $ref: "child.json" },
        },
      },
    ])("uses a $name as the base for nested references", async ({ schema }) => {
      const expectedUrl = "https://schemas.example/scoped/child.json";
      const result = (await $RefParser.dereference(
        "https://schemas.example/root.json",
        schema,
        virtualOptions({ [expectedUrl]: { type: "integer" } }),
      )) as any;

      expect(result.child).toEqual({ type: "integer" });
    });

    it("uses a schema-only root $id path instead of dropping it to the origin", async () => {
      const expectedUrl = "https://schemas.example/base/child.json";
      const result = (await $RefParser.dereference(
        {
          $id: "https://schemas.example/base/root.json",
          child: { $ref: "child.json" },
        },
        virtualOptions({ [expectedUrl]: { type: "string" } }),
      )) as any;

      expect(result.child).toEqual({ type: "string" });
    });

    it("inherits draft-04 id semantics into nested schemas", async () => {
      const expectedUrl = "https://schemas.example/scoped/nested/child.json";
      const result = (await $RefParser.dereference(
        "https://schemas.example/root.json",
        {
          $schema: "http://json-schema.org/draft-04/schema#",
          id: "scoped/",
          nested: {
            id: "nested/",
            child: { $ref: "child.json" },
          },
        },
        virtualOptions({ [expectedUrl]: { type: "null" } }),
      )) as any;

      expect(result.nested.child).toEqual({ type: "null" });
    });

    it("qualifies bundled references out of a nested draft-04 id scope with the root id", async () => {
      const result = (await $RefParser.bundle(
        "https://retrieval.example/dir/input.json",
        {
          $schema: "http://json-schema.org/draft-04/schema#",
          id: "root.json",
          first: { $ref: "mem://base" },
          nested: {
            id: "nested.json",
            second: { $ref: "mem://base" },
          },
        },
        virtualOptions({ "mem://base": { type: "string" } }),
      )) as any;

      expect(result.nested.second.$ref).toBe("root.json#/first");
    });

    it("does not treat an ordinary id property as $id in modern drafts", async () => {
      const expectedUrl = "https://schemas.example/base/child.json";
      const result = (await $RefParser.dereference(
        "https://schemas.example/retrieval.json",
        {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "https://schemas.example/base/root.json",
          nested: {
            id: "wrong/",
            child: { $ref: "child.json" },
          },
        },
        virtualOptions({ [expectedUrl]: { type: "array" } }),
      )) as any;

      expect(result.nested.child).toEqual({ type: "array" });
    });

    it("uses an external document root $id while resolving its children", async () => {
      const documents = {
        "https://schemas.example/external/root.json": {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $id: "./scoped/",
          child: { $ref: "child.json" },
        },
        "https://schemas.example/external/scoped/child.json": { type: "boolean" },
      };
      const result = (await $RefParser.dereference(
        "https://schemas.example/root.json",
        { external: { $ref: "./external/root.json" } },
        virtualOptions(documents),
      )) as any;

      expect(result.external.child).toEqual({ type: "boolean" });
    });
  });
});

function virtualOptions(documents: Record<string, object>) {
  return {
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
  } as any;
}
