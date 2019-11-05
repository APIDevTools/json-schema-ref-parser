"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

describe("Schema with internal $refs with id", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(
      path.rel("specs/internal-with-id/internal-with-id.yaml")
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.abs("specs/internal-with-id/internal-with-id.yaml")
    ]);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("specs/internal-with-id/internal-with-id.yaml"),
      path.abs("specs/internal-with-id/internal-with-id.yaml"),
      parsedSchema
    )
  );

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(
      path.rel("specs/internal-with-id/internal-with-id.yaml"), { dereference: { id: true }}
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(
      path.rel("specs/internal-with-id/internal-with-id.yaml")
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
