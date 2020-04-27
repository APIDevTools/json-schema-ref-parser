"use strict";

const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../../lib");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");

describe("Schema with direct circular (recursive) external $refs", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/circular-external-direct/circular-external-direct-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/circular-external-direct/circular-external-direct-root.yaml")]);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/circular-external-direct/circular-external-direct-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
  });
});
