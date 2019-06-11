"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const internalRefsParsedSchema = require("../internal/parsed");
const internalRefsDereferencedSchema = require("../internal/dereferenced");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

describe("Object sources (instead of file paths)", () => {
  it("should dereference a single object", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(helper.cloneDeep(internalRefsParsedSchema));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(internalRefsDereferencedSchema);
    // The schema path should be the current directory
    let expectedPaths = [
      path.cwd()
    ];
    expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
    expect(parser.$refs.values()).to.have.keys(expectedPaths);
    // Reference equality
    expect(schema.properties.name).to.equal(schema.definitions.name);
    expect(schema.definitions.requiredString)
      .to.equal(schema.definitions.name.properties.first)
      .to.equal(schema.definitions.name.properties.last)
      .to.equal(schema.properties.name.properties.first)
      .to.equal(schema.properties.name.properties.last);
  });

  it("should dereference an object that references external files", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(helper.cloneDeep(parsedSchema.schema));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The schema path should be the current directory, and all other paths should be absolute
    let expectedPaths = [
      path.cwd(),
      path.abs("specs/object-source/definitions/definitions.json"),
      path.abs("specs/object-source/definitions/name.yaml"),
      path.abs("specs/object-source/definitions/required-string.yaml")
    ];
    expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
    expect(parser.$refs.values()).to.have.keys(expectedPaths);
    // Reference equality
    expect(schema.properties.name).to.equal(schema.definitions.name);
    expect(schema.definitions.requiredString)
      .to.equal(schema.definitions.name.properties.first)
      .to.equal(schema.definitions.name.properties.last)
      .to.equal(schema.properties.name.properties.first)
      .to.equal(schema.properties.name.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle an object that references external files", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(helper.cloneDeep(parsedSchema.schema));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The schema path should be the current directory, and all other paths should be absolute
    let expectedPaths = [
      path.cwd(),
      path.abs("specs/object-source/definitions/definitions.json"),
      path.abs("specs/object-source/definitions/name.yaml"),
      path.abs("specs/object-source/definitions/required-string.yaml")
    ];
    expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
    expect(parser.$refs.values()).to.have.keys(expectedPaths);
  });
});
