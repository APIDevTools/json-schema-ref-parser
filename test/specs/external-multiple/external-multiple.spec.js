import { expect } from "chai";
import $RefParser from "../../../lib/index";
import { testResolve } from "../../utils/helper";
import { abs, rel } from "../../utils/path";
import { schema as _schema, definitions } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("Schema with multiple external $refs to different parts of a file", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(abs("specs/external-multiple/external-multiple.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/external-multiple/external-multiple.yaml")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/external-multiple/external-multiple.yaml"),
    abs("specs/external-multiple/external-multiple.yaml"), _schema,
    abs("specs/external-multiple/definitions.yaml"), definitions
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/external-multiple/external-multiple.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.user.example).to.equal(schema.example.user);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/external-multiple/external-multiple.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
