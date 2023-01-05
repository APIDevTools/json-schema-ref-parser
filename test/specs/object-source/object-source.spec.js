import chai from "chai";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import internalRefsParsedSchema from "../internal/parsed.js";
import internalRefsDereferencedSchema from "../internal/dereferenced.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

const { expect } = chai;

const isWindows = /^win/.test(globalThis.process ? globalThis.process.platform : undefined);

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
    if (!isWindows) {
      expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
      expect(parser.$refs.values()).to.have.keys(expectedPaths);
    }
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
    if (!isWindows) {
      expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
      expect(parser.$refs.values()).to.have.keys(expectedPaths);
    }
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
    if (!isWindows) {
      expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
      expect(parser.$refs.values()).to.have.keys(expectedPaths);
    }
  });
});
