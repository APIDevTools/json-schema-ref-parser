"use strict";

const { expect } = require("chai");
const { resolve } = require("path");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const helper = require("../../utils/helper");
const url = require("../../../lib/util/url");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

describe("When executed in the context of root directory", () => {
  // Store the OS root directory
  const root = resolve("/");

  // Store references to the original methods
  const originalProcessCwd = process.cwd;
  const originalUrlCwd = url.cwd;

  /**
   * A mock `process.cwd()` implementation that always returns the root diretory
   */
  function mockProcessCwd () {
    return root;
  }

  /**
   * Temporarily mocks `process.cwd()` while calling the real `url.cwd()` implemenation
   */
  function mockUrlCwd () {
    try {
      process.cwd = mockProcessCwd;
      return originalUrlCwd.apply(null, arguments);
    }
    finally {
      process.cwd = originalProcessCwd;
    }
  }

  beforeEach("Mock process.cwd and url.cwd", () => {
    url.cwd = mockUrlCwd;
  });

  afterEach("Restore process.cwd and url.cwd", () => {
    url.cwd = originalUrlCwd;
    process.cwd = originalProcessCwd; // already restored by the finally block above, but just in case
  });


  it("should parse successfully from an absolute path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.abs("specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.abs("specs/absolute-root/absolute-root.yaml")
    ]);
  });

  it("should parse successfully from a url", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.url("specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.url("specs/absolute-root/absolute-root.yaml")]);
  });

  it("should resolve successfully from an absolute path", helper.testResolve(
    path.abs("specs/absolute-root/absolute-root.yaml"),
    path.abs("specs/absolute-root/absolute-root.yaml"), parsedSchema.schema,
    path.abs("specs/absolute-root/definitions/definitions.json"), parsedSchema.definitions,
    path.abs("specs/absolute-root/definitions/name.yaml"), parsedSchema.name,
    path.abs("specs/absolute-root/definitions/required-string.yaml"), parsedSchema.requiredString
  ));

  it("should resolve successfully from a url", helper.testResolve(
    path.url("specs/absolute-root/absolute-root.yaml"),
    path.url("specs/absolute-root/absolute-root.yaml"), parsedSchema.schema,
    path.url("specs/absolute-root/definitions/definitions.json"), parsedSchema.definitions,
    path.url("specs/absolute-root/definitions/name.yaml"), parsedSchema.name,
    path.url("specs/absolute-root/definitions/required-string.yaml"), parsedSchema.requiredString
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.abs("specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.name).to.equal(schema.definitions.name);
    expect(schema.definitions["required string"])
      .to.equal(schema.definitions.name.properties.first)
      .to.equal(schema.definitions.name.properties.last)
      .to.equal(schema.properties.name.properties.first)
      .to.equal(schema.properties.name.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.abs("specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
