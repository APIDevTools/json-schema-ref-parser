import path from "path";

import { describe, expect, it } from "vitest";

import { $RefParser } from "..";

describe("bundle", () => {
  it("handles circular reference with description", async () => {
    const refParser = new $RefParser();
    const pathOrUrlOrSchema = path.resolve("lib", "__tests__", "spec", "circular-ref-with-description.json");
    const schema = await refParser.bundle({ pathOrUrlOrSchema });
    expect(schema).toEqual({
      schemas: {
        Bar: {
          $ref: '#/schemas/Foo',
          description: 'ok',
        },
        Foo: {
          $ref: '#/schemas/Bar',
        },
      },
    });
  });

  it("bundles multiple references to the same file correctly", async () => {
    const refParser = new $RefParser();
    const pathOrUrlOrSchema = path.resolve("lib", "__tests__", "spec", "multiple-refs.json");
    const schema = (await refParser.bundle({ pathOrUrlOrSchema })) as any;

    // Both parameters should now be $ref to the same internal definition
    const firstParam = schema.paths["/test1/{pathId}"].get.parameters[0];
    const secondParam = schema.paths["/test2/{pathId}"].get.parameters[0];

    // The $ref should match the output structure in file_context_0
    expect(firstParam.$ref).toBe("#/components/parameters/path-parameter_pathId");
    expect(secondParam.$ref).toBe("#/components/parameters/path-parameter_pathId");

    // The referenced parameter should exist and match the expected structure
    expect(schema.components).toBeDefined();
    expect(schema.components.parameters).toBeDefined();
    expect(schema.components.parameters["path-parameter_pathId"]).toEqual({
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
