import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

const isBrowser = typeof window !== "undefined";

describe.skipIf(isBrowser)("Special-character file paths", () => {
  // Adapted replacement for the repo's previously ignored filename regression, using
  // a cross-platform-safe subset of special characters.
  const schemaPath = path.rel(
    "test/specs/special-characters-files/dir with [brackets] & spaces/root schema.yaml",
  );
  const nestedPath = path.abs(
    "test/specs/special-characters-files/dir with [brackets] & spaces/defs [value] %.json",
  );

  it("should resolve external refs from filenames with spaces and special characters", async () => {
    const parser = new $RefParser();
    const $refs = await parser.resolve(schemaPath);
    const resolvedPath = $refs.paths().find((entry) => entry.includes("defs [value] %.json"));
    const values = $refs.values();

    expect($refs.paths()).toContain(nestedPath);
    expect(resolvedPath).toBeTruthy();
    expect(values[resolvedPath as string]).toEqual({
      definitions: {
        value: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      },
    });
    expect(values[resolvedPath as string].definitions.value).toEqual({
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
