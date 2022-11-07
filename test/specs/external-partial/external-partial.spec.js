import { expect } from "chai";
import $RefParser from "../../..";
import { testResolve } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { schema as _schema, definitions, name, requiredString } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("Schema with $refs to parts of external files", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/external-partial/external-partial.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/external-partial/external-partial.yaml")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/external-partial/external-partial.yaml"),
    abs("specs/external-partial/external-partial.yaml"), _schema,
    abs("specs/external-partial/definitions/definitions.json"), definitions,
    abs("specs/external-partial/definitions/name.yaml"), name,
    abs("specs/external-partial/definitions/required-string.yaml"), requiredString
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/external-partial/external-partial.yaml"));
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
    const schema = await parser.bundle(rel("specs/external-partial/external-partial.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
