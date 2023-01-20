import chai from "chai";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

const { expect } = chai;

describe("Schema with $refs to parts of external files", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/external-partial/external-partial.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/external-partial/external-partial.yaml")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/external-partial/external-partial.yaml"),
    path.abs("specs/external-partial/external-partial.yaml"), parsedSchema.schema,
    path.abs("specs/external-partial/definitions/definitions.json"), parsedSchema.definitions,
    path.abs("specs/external-partial/definitions/name.yaml"), parsedSchema.name,
    path.abs("specs/external-partial/definitions/required-string.yaml"), parsedSchema.requiredString
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/external-partial/external-partial.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.name.properties.first)
      .to.equal(schema.properties.name.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/external-partial/external-partial.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
