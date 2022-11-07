import { expect } from "chai";
import $RefParser from "../../..";
import { cloneDeep } from "../../utils/helper";
import { abs, rel } from "../../utils/path";
import internalRefsParsedSchema from "../internal/parsed";
import internalRefsDereferencedSchema from "../internal/dereferenced";
import { schema as _schema } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("Object sources with file paths", () => {
  it("should dereference a single object", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(
      // This file doesn't actually need to exist. But its path will be used to resolve external $refs
      abs("path/that/does/not/exist.yaml"),
      // This schema object does not contain any external $refs
      cloneDeep(internalRefsParsedSchema),
      // An options object MUST be passed (even if it's empty)
      {});
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(internalRefsDereferencedSchema);
    // The schema path should match the one we pass-in
    let expectedPaths = [
      abs("path/that/does/not/exist.yaml")
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
      abs("specs/object-source-with-path/schema-file-that-does-not-exist.yaml"),
      // This schema object contains external $refs
      cloneDeep(_schema),
      // An options object MUST be passed (even if it's empty)
      {});
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The schema path should match the one we passed-in.
    // All other paths should be the actual paths of referenced files.
    let expectedPaths = [
      abs("specs/object-source-with-path/schema-file-that-does-not-exist.yaml"),
      abs("specs/object-source-with-path/definitions/definitions.json"),
      abs("specs/object-source-with-path/definitions/name.yaml"),
      abs("specs/object-source-with-path/definitions/required-string.yaml")
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
      rel("specs/object-source-with-path/schema-file-that-does-not-exist.yaml"),
      // This schema object contains external $refs
      cloneDeep(_schema),
      // An options object MUST be passed (even if it's empty)
      {});
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The schema path should match the one we passed-in.
    // All other paths should be the actual paths of referenced files.
    let expectedPaths = [
      abs("specs/object-source-with-path/schema-file-that-does-not-exist.yaml"),
      abs("specs/object-source-with-path/definitions/definitions.json"),
      abs("specs/object-source-with-path/definitions/name.yaml"),
      abs("specs/object-source-with-path/definitions/required-string.yaml")
    ];
    expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
    expect(parser.$refs.values()).to.have.keys(expectedPaths);
  });
});
