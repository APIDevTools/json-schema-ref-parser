import { expect } from "chai";
import $RefParser from "../../..";
import { testResolve } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { schema as _schema, definitions, strings } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("$refs that are substrings of each other", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/substrings/substrings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/substrings/substrings.yaml")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/substrings/substrings.yaml"),
    abs("specs/substrings/substrings.yaml"), _schema,
    abs("specs/substrings/definitions/definitions.json"), definitions,
    abs("specs/substrings/definitions/strings.yaml"), strings
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/substrings/substrings.yaml"));
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
    const schema = await parser.bundle(rel("specs/substrings/substrings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
