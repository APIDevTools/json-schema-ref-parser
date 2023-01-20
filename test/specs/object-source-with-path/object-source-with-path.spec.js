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

describe("Object sources with file paths", () => {
  it("should dereference a single object", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(
      // This file doesn't actually need to exist. But its path will be used to resolve external $refs
      path.abs("path/that/does/not/exist.yaml"),
      // This schema object does not contain any external $refs
      helper.cloneDeep(internalRefsParsedSchema),
      // An options object MUST be passed (even if it's empty)
      {});
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(internalRefsDereferencedSchema);
    // The schema path should match the one we pass-in
    let expectedPaths = [
      path.abs("path/that/does/not/exist.yaml")
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
    const schema = await parser.dereference(
      // This file doesn't actually need to exist. But its path will be used to resolve external $refs
      path.abs("specs/object-source-with-path/schema-file-that-does-not-exist.yaml"),
      // This schema object contains external $refs
      helper.cloneDeep(parsedSchema.schema),
      // An options object MUST be passed (even if it's empty)
      {});
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The schema path should match the one we passed-in.
    // All other paths should be the actual paths of referenced files.
    let expectedPaths = [
      path.abs("specs/object-source-with-path/schema-file-that-does-not-exist.yaml"),
      path.abs("specs/object-source-with-path/definitions/definitions.json"),
      path.abs("specs/object-source-with-path/definitions/name.yaml"),
      path.abs("specs/object-source-with-path/definitions/required-string.yaml")
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
    const schema = await parser.bundle(
      // This file doesn't actually need to exist. But its path will be used to resolve external $refs
      path.rel("specs/object-source-with-path/schema-file-that-does-not-exist.yaml"),
      // This schema object contains external $refs
      helper.cloneDeep(parsedSchema.schema),
      // An options object MUST be passed (even if it's empty)
      {});
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The schema path should match the one we passed-in.
    // All other paths should be the actual paths of referenced files.
    let expectedPaths = [
      path.abs("specs/object-source-with-path/schema-file-that-does-not-exist.yaml"),
      path.abs("specs/object-source-with-path/definitions/definitions.json"),
      path.abs("specs/object-source-with-path/definitions/name.yaml"),
      path.abs("specs/object-source-with-path/definitions/required-string.yaml")
    ];
    expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
    expect(parser.$refs.values()).to.have.keys(expectedPaths);
  });
});
