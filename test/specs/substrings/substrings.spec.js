import chai from "chai";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

const { expect } = chai;

describe("$refs that are substrings of each other", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/substrings/substrings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/substrings/substrings.yaml")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/substrings/substrings.yaml"),
    path.abs("specs/substrings/substrings.yaml"), parsedSchema.schema,
    path.abs("specs/substrings/definitions/definitions.json"), parsedSchema.definitions,
    path.abs("specs/substrings/definitions/strings.yaml"), parsedSchema.strings
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/substrings/substrings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.firstName).to.equal(schema.definitions.name);
    expect(schema.properties.middleName).to.equal(schema.definitions["name-with-min-length"]);
    expect(schema.properties.lastName).to.equal(schema.definitions["name-with-min-length-max-length"]);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/substrings/substrings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
