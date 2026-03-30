import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

const isBrowser = typeof window !== "undefined";

function normalizePathForAssertion(entry: string) {
  return decodeURIComponent(entry.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"))
    .replace(/\\/g, "/")
    .replace(/^file:\/\/\/([A-Z]):/, (_match, drive: string) => `file:///${drive.toLowerCase()}:`)
    .replace(/^([A-Z]):/, (_match, drive: string) => `${drive.toLowerCase()}:`);
}

describe.skipIf(isBrowser)("Special-character file paths", () => {
  // Adapted replacement for the repo's previously ignored filename regression, using
  // a cross-platform-safe subset of special characters.
  const schemaPath = path.rel(
    "test/specs/special-characters-files/dir with [brackets] & spaces/root schema.yaml",
  );

  it("should resolve external refs from filenames with spaces and special characters", async () => {
    const parser = new $RefParser();
    const $refs = await parser.resolve(schemaPath);
    const values = $refs.values();
    const resolvedEntry = Object.entries(values).find(([entry]) =>
      normalizePathForAssertion(entry).includes("defs [value] %.json"),
    );

    expect(resolvedEntry).toBeTruthy();
    expect(resolvedEntry?.[1]).toEqual({
      definitions: {
        value: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      },
    });
    expect((resolvedEntry?.[1] as any).definitions.value).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
      },
    });
  });

  it("should dereference external refs from filenames with spaces and special characters", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(schemaPath);

    expect(schema.properties.item).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
      },
    });
    expect(parser.$refs.circular).toBe(false);
  });
});
