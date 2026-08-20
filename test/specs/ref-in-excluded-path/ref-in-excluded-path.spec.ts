import { describe, it } from "vitest";
import $RefParser, { MissingPointerError } from "../../../lib/index.js";
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

  it("should supply root-relative paths while resolving", async () => {
    const matcher = (schemaPath: string) => schemaPath === "#/example";
    const schema = await $RefParser.dereference(path.rel("test/specs/ref-in-excluded-path/matcher-paths/exact.yaml"), {
      resolve: { excludedPathMatcher: matcher },
      dereference: { excludedPathMatcher: matcher },
    });

    expect(schema).to.deep.equal({
      example: { $ref: "./does-not-exist.yaml" },
    });
  });

  it("should not include the source file path in matcher paths", async () => {
    const matcher = (schemaPath: string) => schemaPath.includes("/example/");
    const schema = await $RefParser.dereference(
      path.rel("test/specs/ref-in-excluded-path/matcher-paths/example/schema.yaml"),
      {
        resolve: { excludedPathMatcher: matcher },
      },
    );

    expect(schema).to.deep.equal({
      property: { type: "string" },
    });
  });

  it("should retain the logical path while crawling an external document", async () => {
    const matcher = (schemaPath: string) => schemaPath === "#/wrapper/example";
    const schema = await $RefParser.dereference(
      path.rel("test/specs/ref-in-excluded-path/matcher-paths/external-root.yaml"),
      {
        resolve: { excludedPathMatcher: matcher },
        dereference: { excludedPathMatcher: matcher },
      },
    );

    expect(schema).to.deep.equal({
      wrapper: {
        example: { $ref: "./does-not-exist.yaml" },
      },
    });
  });

  it("should not follow excluded references reached through internal refs while dereferencing", async () => {
    const inputSchema = {
      embedded: {
        child: {
          $ref: "./does-not-exist.yaml",
          literal: { value: "raw child data" },
        },
      },
      use: { $ref: "#/embedded" },
      useChild: { $ref: "#/embedded/child" },
      useLiteral: { $ref: "#/embedded/child/literal" },
      useLiteralValue: { $ref: "#/embedded/child/literal/value" },
      useNested: { $ref: "#/embedded/child/yet-to-resolve" },
      useNestedAlias: { $ref: "#/aliasChild/yet-to-resolve" },
      aliasChild: { $ref: "#/embedded/child" },
      useExtended: { $ref: "#/embedded", description: "Reusable literal data" },
    };

    const schema = await $RefParser.dereference(inputSchema, {
      resolve: { excludedPathMatcher: (schemaPath) => schemaPath === "#/embedded" },
    });

    expect(schema).to.deep.equal({
      embedded: {
        child: {
          $ref: "./does-not-exist.yaml",
          literal: { value: "raw child data" },
        },
      },
      use: {
        child: {
          $ref: "./does-not-exist.yaml",
          literal: { value: "raw child data" },
        },
      },
      useChild: {
        $ref: "./does-not-exist.yaml",
        literal: { value: "raw child data" },
      },
      useLiteral: { value: "raw child data" },
      useLiteralValue: "raw child data",
      useNested: { $ref: "#/embedded/child/yet-to-resolve" },
      useNestedAlias: { $ref: "#/aliasChild/yet-to-resolve" },
      aliasChild: {
        $ref: "./does-not-exist.yaml",
        literal: { value: "raw child data" },
      },
      useExtended: {
        child: {
          $ref: "./does-not-exist.yaml",
          literal: { value: "raw child data" },
        },
        description: "Reusable literal data",
      },
    });
  });

  it("should not process excluded references reached through internal refs while bundling", async () => {
    const inputSchema = {
      embedded: {
        child: {
          $ref: "./does-not-exist.yaml",
          literal: { value: "raw child data" },
        },
      },
      use: { $ref: "#/embedded" },
      useChild: { $ref: "#/embedded/child" },
      useLiteral: { $ref: "#/embedded/child/literal" },
      useLiteralValue: { $ref: "#/embedded/child/literal/value" },
      useNested: { $ref: "#/embedded/child/yet-to-resolve" },
      useNestedAlias: { $ref: "#/aliasChild/yet-to-resolve" },
      aliasChild: { $ref: "#/embedded/child" },
      useExtended: { $ref: "#/embedded", description: "Reusable literal data" },
    };

    const schema = await $RefParser.bundle(inputSchema, {
      resolve: { excludedPathMatcher: (schemaPath) => schemaPath === "#/embedded" },
    });

    expect(schema).to.deep.equal(inputSchema);
  });

  it("should continue resolving through intermediate refs outside resolution exclusions", async () => {
    const schema = await $RefParser.dereference({
      embedded: {
        child: { $ref: "#/target" },
      },
      target: {
        yetToResolve: { type: "string" },
      },
      useNested: { $ref: "#/embedded/child/yetToResolve" },
    });

    expect(schema).to.deep.equal({
      embedded: {
        child: {
          yetToResolve: { type: "string" },
        },
      },
      target: {
        yetToResolve: { type: "string" },
      },
      useNested: { type: "string" },
    });
  });

  it("should reject missing literal pointer targets inside values skipped during resolution", async () => {
    await expect(
      $RefParser.dereference(
        {
          embedded: { literal: {} },
          useMissing: { $ref: "#/embedded/missing" },
        },
        {
          resolve: { excludedPathMatcher: (schemaPath) => schemaPath === "#/embedded" },
        },
      ),
    ).rejects.toBeInstanceOf(MissingPointerError);
  });

  it("should reset resolution exclusions between parser operations", async () => {
    const parser = new $RefParser();
    const embedded = {
      child: { $ref: "#/target" },
    };

    await parser.dereference(
      { embedded },
      {
        resolve: { excludedPathMatcher: (schemaPath) => schemaPath === "#/embedded" },
      },
    );

    const schema = await parser.dereference({ embedded, target: { type: "string" } });

    expect(schema).to.deep.equal({
      embedded: {
        child: { type: "string" },
      },
      target: { type: "string" },
    });
  });

  it("should record circular resolution exclusions without recursing forever", async () => {
    const embedded: {
      child: { $ref: string };
      self?: unknown;
    } = {
      child: { $ref: "./does-not-exist.yaml" },
    };
    embedded.self = embedded;

    await $RefParser.dereference(
      { embedded },
      {
        resolve: { excludedPathMatcher: (schemaPath) => schemaPath === "#/embedded" },
      },
    );

    expect(embedded.child).to.deep.equal({ $ref: "./does-not-exist.yaml" });
  });
});
