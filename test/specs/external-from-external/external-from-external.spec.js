"use strict";

const { expect } = require("chai");
const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

describe("Schema with external $refs to nested external files", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(
      path.abs("specs/external-from-external/external-from-external.yaml")
    );
    expect(schema).to.equal(parser.schema);

    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.abs("specs/external-from-external/external-from-external.yaml"),
    ]);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("specs/external-from-external/external-from-external.yaml"),
      path.abs("specs/external-from-external/external-from-external.yaml"),
      parsedSchema.schema,
      path.abs("specs/external-from-external/page-one.yaml"),
      parsedSchema.pageOne,
      path.abs("specs/external-from-external/external-one.yaml"),
      parsedSchema.externalOne,
      path.abs("specs/external-from-external/external-two.yaml"),
      parsedSchema.externalTwo,
      path.abs("specs/external-from-external/external-three.yaml"),
      parsedSchema.externalThree,
    )
  );

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(
      path.rel("specs/external-from-external/external-from-external.yaml")
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(
      path.rel("specs/external-from-external/external-from-external.yaml")
    );
    console.log(JSON.stringify(schema));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
