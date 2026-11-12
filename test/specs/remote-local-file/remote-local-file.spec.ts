import fs from "node:fs";
import os from "node:os";
import nodePath from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import { ResolverError } from "../../../lib/util/errors.js";
import helper from "../../utils/helper.js";

const isBrowser = typeof window !== "undefined";

describe.skipIf(isBrowser)("Local files referenced from a remote schema", () => {
  let dir: string;
  let secretPath: string;
  let secretUrl: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(nodePath.join(os.tmpdir(), "json-schema-ref-parser-"));
    secretPath = nodePath.join(dir, "secret.json");
    fs.writeFileSync(secretPath, JSON.stringify({ secret: "SECRET-LOCAL" }));
    secretUrl = pathToFileURL(secretPath).href;
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  // Serves https://example.com/* from memory, so no network is used.
  function remote(files: Record<string, unknown>) {
    return {
      order: 1,
      canRead: /^https:\/\/example\.com\//,
      read: (file: { url: string }) => JSON.stringify(files[file.url]),
    };
  }

  it("rejects an absolute file:// $ref in a schema whose path is an https URL", async () => {
    const schema = { components: { schemas: { leak: { $ref: secretUrl } } } };
    try {
      await new $RefParser().dereference("https://example.com/openapi.json", schema, {});
      helper.shouldNotGetCalled();
    } catch (err: any) {
      expect(err).to.be.an.instanceOf(ResolverError);
      expect(err.message).to.contain("from remote schema");
      expect(JSON.stringify(schema)).not.to.contain("SECRET-LOCAL");
    }
  });

  it("rejects a file:// $ref in a schema downloaded over https", async () => {
    const options = {
      resolve: {
        remote: remote({
          "https://example.com/openapi.json": { leak: { $ref: secretUrl } },
        }),
      },
    };
    await expect(new $RefParser().dereference("https://example.com/openapi.json", options)).rejects.toThrow(
      "from remote schema",
    );
  });

  it("rejects a relative $ref resolved against a file:// $id in a remote schema", async () => {
    const options = {
      resolve: {
        remote: remote({
          "https://example.com/openapi.json": {
            $schema: "https://json-schema.org/draft/2020-12/schema",
            $id: pathToFileURL(nodePath.join(dir, "root.json")).href,
            properties: { leak: { $ref: "secret.json" } },
          },
        }),
      },
    };
    await expect(new $RefParser().dereference("https://example.com/openapi.json", options)).rejects.toThrow(
      "from remote schema",
    );
  });

  it("rejects it when following a remote $ref from a remote schema", async () => {
    const options = {
      resolve: {
        remote: remote({
          "https://example.com/openapi.json": { a: { $ref: "https://example.com/b.json" } },
          "https://example.com/b.json": { leak: { $ref: secretUrl } },
        }),
      },
    };
    await expect(new $RefParser().dereference("https://example.com/openapi.json", options)).rejects.toThrow(
      "from remote schema",
    );
  });

  it("rejects it with resolveExcludedPathMatcher too", async () => {
    const schema = { leak: { $ref: secretUrl } };
    await expect(
      new $RefParser().dereference("https://example.com/openapi.json", schema, {
        resolveExcludedPathMatcher: () => false,
      }),
    ).rejects.toThrow("from remote schema");
  });

  it("reports it as a ResolverError with continueOnError", async () => {
    const schema = { components: { schemas: { leak: { $ref: secretUrl } } } };
    try {
      await new $RefParser().dereference("https://example.com/openapi.json", schema, { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err: any) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          path: ["components", "schemas", "leak"],
          message: (message: string) => message.includes("from remote schema"),
        },
      ]);
    }
  });

  it("still resolves local files from a local schema", async () => {
    const rootPath = nodePath.join(dir, "root.json");
    fs.writeFileSync(rootPath, JSON.stringify({ data: { $ref: "secret.json" } }));
    const schema = await new $RefParser().dereference(rootPath);
    expect(schema).to.deep.equal({ data: { secret: "SECRET-LOCAL" } });
  });
});
