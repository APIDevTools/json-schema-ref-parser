"use strict";

const { expect } = require("chai");
const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const path = require("../../utils/path");

describe("Empty schema", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(schema).to.be.empty;  // eslint-disable-line no-unused-expressions
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/empty/empty.json")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/empty/empty.json"),
    path.abs("specs/empty/empty.json"), {}
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(schema).to.be.empty;  // eslint-disable-line no-unused-expressions
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/empty/empty.json")]);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(schema).to.be.empty;  // eslint-disable-line no-unused-expressions
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/empty/empty.json")]);
  });

  it('should throw an error if "parse.json.allowEmpty" is disabled', async () => {
    try {
      await $RefParser.parse(path.rel("specs/empty/empty.json"), { parse: { json: { allowEmpty: false }}});
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      expect(err.message).to.contain("Error parsing ");
      expect(err.message).to.contain('empty/empty.json"');
      expect(err.message).to.contain("Parsed value is empty");
    }
  });
});
