"use strict";

const { expect } = require("chai");
const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

/**
 * This test is from PR #
 * https://github.com/APIDevTools/json-schema-ref-parser/pull/62
 */
describe("Schema with external root refs", () => {
  it("should parse successfully from an absolute path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.abs("specs/external-root/external-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/external-root/external-root.yaml")]);
  });

  it("should parse successfully from a relative path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/external-root/external-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/external-root/external-root.yaml")]);
  });

  it("should parse successfully from a url", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.url("specs/external-root/external-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.url("specs/external-root/external-root.yaml")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.abs("specs/external-root/external-root.yaml"),
    path.abs("specs/external-root/external-root.yaml"), parsedSchema.schema,
    path.abs("specs/external-root/definitions.yaml"), parsedSchema.definitions,
    path.abs("specs/external-root/definitions-other.yaml"), parsedSchema.definitionsOther
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/external-root/external-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/external-root/external-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
