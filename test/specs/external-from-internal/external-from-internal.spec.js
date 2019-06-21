"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

/**
 * This test is from PR #62
 * https://github.com/APIDevTools/json-schema-ref-parser/pull/62
 */
describe("Schema with two external refs to the same value and internal ref before", () => {
  it("should parse successfully from an absolute path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.abs("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/external-from-internal/external-from-internal.yaml")]);
  });

  it("should parse successfully from a relative path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/external-from-internal/external-from-internal.yaml")]);
  });

  it("should parse successfully from a url", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.url("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.url("specs/external-from-internal/external-from-internal.yaml")]);
  });

  it("should resolve successfully from an absolute path", helper.testResolve(
    path.abs("specs/external-from-internal/external-from-internal.yaml"),
    path.abs("specs/external-from-internal/external-from-internal.yaml"), parsedSchema.schema,
    path.abs("specs/external-from-internal/definitions.yaml"), parsedSchema.definitions
  ));

  it("should resolve successfully from a relative path", helper.testResolve(
    path.rel("specs/external-from-internal/external-from-internal.yaml"),
    path.abs("specs/external-from-internal/external-from-internal.yaml"), parsedSchema.schema,
    path.abs("specs/external-from-internal/definitions.yaml"), parsedSchema.definitions
  ));

  it("should resolve successfully from a url", helper.testResolve(
    path.url("specs/external-from-internal/external-from-internal.yaml"),
    path.url("specs/external-from-internal/external-from-internal.yaml"), parsedSchema.schema,
    path.url("specs/external-from-internal/definitions.yaml"), parsedSchema.definitions
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.internal1).to.equal(schema.internal2);
    expect(schema.internal2).to.equal(schema.external1);
    expect(schema.internal3).to.equal(schema.internal4);
    expect(schema.internal4).to.equal(schema.external2);
    expect(schema.internal1.test)
      .to.equal(schema.internal2.test)
      .to.equal(schema.internal3.test)
      .to.equal(schema.internal4.test)
      .to.equal(schema.external1.test)
      .to.equal(schema.external2.test);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
