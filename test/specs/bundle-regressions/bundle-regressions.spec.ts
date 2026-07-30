import { afterEach, describe, expect, it, vi } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("bundle regressions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not rewrite a pointer to an extended-ref sibling through the ref target", async () => {
    const schema = {
      $defs: {
        base: {
          type: "object",
          properties: {
            inherited: { type: "number" },
          },
        },
      },
      node: {
        $ref: "#/$defs/base",
        properties: {
          own: { type: "string" },
        },
      },
      use: { $ref: "#/node/properties/own" },
    };

    const bundled = await $RefParser.bundle(structuredClone(schema));

    expect(bundled.use.$ref).toBe("#/node/properties/own");
    await expect($RefParser.dereference(structuredClone(bundled))).resolves.toMatchObject({
      use: { type: "string" },
    });
  });

  it("leaves actual external refs untouched when resolve.external is false", async () => {
    const schema = {
      definitions: {
        local: { type: "string" },
      },
      local: { $ref: "#/definitions/local" },
      external: { $ref: "missing.json#/definition" },
    };

    const bundled = await $RefParser.bundle(structuredClone(schema), {
      resolve: { external: false },
    });

    expect(bundled.local.$ref).toBe("#/definitions/local");
    expect(bundled.external.$ref).toBe("missing.json#/definition");
  });

  it("qualifies duplicate refs that are remapped inside an inline nested $id scope", async () => {
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "mem://root",
      first: { $ref: "mem://base" },
      nested: {
        $id: "mem://nested",
        second: { $ref: "mem://base" },
      },
    };
    const options = {
      resolve: {
        mem: {
          canRead: /^mem:/,
          read: { type: "string" },
        },
      },
    };

    const bundled = await $RefParser.bundle(structuredClone(schema), options);

    expect(bundled.first).toEqual({ type: "string" });
    expect(bundled.nested.second.$ref).toBe("mem://root#/first");
    await expect($RefParser.dereference(structuredClone(bundled), options)).resolves.toMatchObject({
      nested: { second: { type: "string" } },
    });
  });

  it("uses an external document's root $id while inventorying its nested refs", async () => {
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "mem://root",
      entry: { $ref: "mem://retrieval" },
    };
    const options = {
      resolve: {
        mem: {
          canRead: /^mem:/,
          read(file: { url: string }) {
            if (file.url === "mem://retrieval") {
              return {
                $schema: "https://json-schema.org/draft/2020-12/schema",
                $id: "mem://canonical/external",
                type: "object",
                properties: {
                  child: { $ref: "child" },
                },
              };
            }
            if (file.url === "mem://canonical/child") {
              return { type: "integer" };
            }
            throw new Error(`Unexpected memory URL: ${file.url}`);
          },
        },
      },
    };

    const bundled = await $RefParser.bundle(structuredClone(schema), options);

    expect(bundled.entry).toMatchObject({
      $id: "mem://canonical/external",
      properties: {
        child: { type: "integer" },
      },
    });
  });

  it.runIf(!process.env.BROWSER)(
    'uses the cwd consistently while bundling with externalReferenceResolution: "root"',
    async () => {
      vi.spyOn(process, "cwd").mockReturnValue(path.abs("test/specs/relative-path"));
      const parser = new $RefParser();

      const bundled = await parser.bundle("schemas/accountList.json", {
        dereference: { externalReferenceResolution: "root" },
      });

      expect(bundled.properties.data.items).toMatchObject({
        title: "Account",
        properties: {
          accountOwner: {
            title: "User",
          },
        },
      });
    },
  );

  it("preserves pre-existing JavaScript object cycles without overflowing", async () => {
    const schema: any = {
      definitions: {
        local: { type: "string" },
      },
      local: { $ref: "#/definitions/local" },
    };
    schema.self = schema;

    const bundled = await $RefParser.bundle(schema);

    expect(bundled).toBe(schema);
    expect(bundled.self).toBe(bundled);
    expect(bundled.local.$ref).toBe("#/definitions/local");
  });
});
