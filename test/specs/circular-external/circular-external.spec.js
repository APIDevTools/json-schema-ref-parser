"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

describe("Schema with circular (recursive) external $refs", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/circular-external/circular-external.yaml")]);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/circular-external/circular-external.yaml"),
    path.abs("specs/circular-external/circular-external.yaml"), parsedSchema.schema,
    path.abs("specs/circular-external/definitions/pet.yaml"), parsedSchema.pet,
    path.abs("specs/circular-external/definitions/child.yaml"), parsedSchema.child,
    path.abs("specs/circular-external/definitions/parent.yaml"), parsedSchema.parent,
    path.abs("specs/circular-external/definitions/person.yaml"), parsedSchema.person
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
    // Reference equality
    expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
    expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
    expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
  });

  it('should throw an error if "options.$refs.circular" is false', async () => {
    let parser = new $RefParser();

    try {
      await parser.dereference(path.rel("specs/circular-external/circular-external.yaml"), { dereference: { circular: false }});
      helper.shouldNotGetCalled();
    }
    catch (err) {
      // A ReferenceError should have been thrown
      expect(err).to.be.an.instanceOf(ReferenceError);
      expect(err.message).to.contain("Circular $ref pointer found at ");
      expect(err.message).to.contain("specs/circular-external/circular-external.yaml#/definitions/thing");

      // $Refs.circular should be true
      expect(parser.$refs.circular).to.equal(true);
    }
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });
});
