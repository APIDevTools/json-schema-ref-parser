import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";
import dereferencedSchema from "./dereferenced.js";

import { expect } from "vitest";

describe("Schema with literal $refs in examples", () => {
  const excludedPathMatcher = (schemaPath: string) => {
    return /\/example(\/|$|s\/[^/]+\/value(\/|$))/.test(schemaPath);
  };

  it("should exclude the given paths from resolving and dereferencing", async () => {
    const parser = new $RefParser();

    const schema = await parser.dereference(path.rel("test/specs/ref-in-excluded-path/ref-in-excluded-path.yaml"), {
      resolve: {
        excludedPathMatcher,
      },
      dereference: {
        excludedPathMatcher,
      },
    });
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should exclude the given paths from resolving and bundling", async () => {
    const parser = new $RefParser();
    const schemaPath = path.rel("test/specs/ref-in-excluded-path/ref-in-excluded-path.yaml");
    const parsedSchema = await $RefParser.parse(schemaPath);

    const schema = await parser.bundle(schemaPath, {
      resolve: {
        excludedPathMatcher,
      },
      bundle: {
        excludedPathMatcher,
      },
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
  });

  it("should supply the path value so callers can distinguish references", async () => {
    const matcher = (schemaPath: string, value?: unknown) => {
      return (
        schemaPath.includes("/example/") &&
        typeof value === "object" &&
        value !== null &&
        "$ref" in value &&
        typeof value.$ref === "string" &&
        !value.$ref.startsWith("#")
      );
    };
    const inputSchema = {
      definitions: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      },
      example: {
        internal: { $ref: "#/definitions/user" },
        manager: {
          $ref: "https://gateway.example.com/scim/v2/Users/789012",
          value: "789012",
          displayName: "Jane Manager",
        },
      },
    };
    const expectedSchema = {
      definitions: {
        user: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      },
      example: {
        internal: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        manager: {
          $ref: "https://gateway.example.com/scim/v2/Users/789012",
          value: "789012",
          displayName: "Jane Manager",
        },
      },
    };

    const schema = await $RefParser.dereference(inputSchema, {
      resolve: { excludedPathMatcher: matcher },
      dereference: { excludedPathMatcher: matcher },
    });

    expect(schema).to.deep.equal(expectedSchema);
  });
});
