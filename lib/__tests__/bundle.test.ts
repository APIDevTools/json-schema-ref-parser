import path from "path";

import { describe, expect, it } from "vitest";

import { $RefParser } from "..";

describe("bundle", () => {
  it("handles circular reference with description", async () => {
    const refParser = new $RefParser();
    const pathOrUrlOrSchema = path.resolve("lib", "__tests__", "spec", "circular-ref-with-description.json");
    const schema = await refParser.bundle({ pathOrUrlOrSchema });
    expect(schema).not.toBeUndefined();
  });

  it("bundles multiple references to the same file correctly", async () => {
    const refParser = new $RefParser();
    const pathOrUrlOrSchema = path.resolve("lib", "__tests__", "spec", "multiple-refs.json");
    const schema = (await refParser.bundle({ pathOrUrlOrSchema })) as any;

    // First reference should be fully resolved (no $ref)
    expect(schema.paths["/test1/{pathId}"].get.parameters[0].name).toBe("pathId");
    expect(schema.paths["/test1/{pathId}"].get.parameters[0].schema.type).toBe("string");
    expect(schema.paths["/test1/{pathId}"].get.parameters[0].schema.format).toBe("uuid");
    expect(schema.paths["/test1/{pathId}"].get.parameters[0].$ref).toBeUndefined();

    // Second reference should be remapped to point to the first reference
    expect(schema.paths["/test2/{pathId}"].get.parameters[0].$ref).toBe(
      "#/paths/~1test1~1%7BpathId%7D/get/parameters/0",
    );

    // Both should effectively resolve to the same data
    const firstParam = schema.paths["/test1/{pathId}"].get.parameters[0];
    const secondParam = schema.paths["/test2/{pathId}"].get.parameters[0];

    // The second parameter should resolve to the same data as the first
    expect(secondParam.$ref).toBeDefined();
    expect(firstParam).toEqual({
      name: "pathId",
      in: "path",
      required: true,
      schema: {
        type: "string",
        format: "uuid",
        description: "Unique identifier for the path",
      },
    });
  });
});
