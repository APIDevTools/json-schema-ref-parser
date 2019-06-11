"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

describe("Schema with deeply-nested circular $refs", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/deep-circular/deep-circular.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/deep-circular/deep-circular.yaml")]);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/deep-circular/deep-circular.yaml"),
    path.abs("specs/deep-circular/deep-circular.yaml"), parsedSchema.schema,
    path.abs("specs/deep-circular/definitions/name.yaml"), parsedSchema.name,
    path.abs("specs/deep-circular/definitions/required-string.yaml"), parsedSchema.requiredString
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/deep-circular/deep-circular.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
    // Reference equality
    expect(schema.definitions.name)
      .to.equal(schema.properties.name)
      .to.equal(schema.properties.level1.properties.name)
      .to.equal(schema.properties.level1.properties.level2.properties.name)
      .to.equal(schema.properties.level1.properties.level2.properties.level3.properties.name)
      .to.equal(schema.properties.level1.properties.level2.properties.level3.properties.level4.properties.name);
  });

  it('should throw an error if "options.$refs.circular" is false', async () => {
    let parser = new $RefParser();

    try {
      await parser.dereference(path.rel("specs/deep-circular/deep-circular.yaml"), { dereference: { circular: false }});
      helper.shouldNotGetCalled();
    }
    catch (err) {
      // A ReferenceError should have been thrown
      expect(err).to.be.an.instanceOf(ReferenceError);
      expect(err.message).to.contain("Circular $ref pointer found at ");
      expect(err.message).to.contain(
        "specs/deep-circular/deep-circular.yaml#/properties/level1/properties/level2/properties/" +
        "level3/properties/level4/properties/level5/properties/level6/properties/level7/properties/" +
        "level8/properties/level9/properties/level10/properties/level11/properties/level12/properties/" +
        "level13/properties/level14/properties/level15/properties/level16/properties/level17/properties/" +
        "level18/properties/level19/properties/level20/properties/level21/properties/level22/properties/" +
        "level23/properties/level24/properties/level25/properties/level26/properties/level27/properties/" +
        "level28/properties/level29/properties/level30");

      // $Refs.circular should be true
      expect(parser.$refs.circular).to.equal(true);
    }
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/deep-circular/deep-circular.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });
});
