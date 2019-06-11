"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");

describe("Schema without any $refs", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/no-refs/no-refs.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/no-refs/no-refs.yaml")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/no-refs/no-refs.yaml"),
    path.abs("specs/no-refs/no-refs.yaml"), parsedSchema
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/no-refs/no-refs.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/no-refs/no-refs.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
  });
});
