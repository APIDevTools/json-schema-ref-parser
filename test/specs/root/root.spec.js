import { expect } from "chai";
import $RefParser from "../../../lib/index";
import { testResolve } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { schema as _schema, root, extended, name } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("Schema with a top-level (root) $ref", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/root/root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/root/root.yaml")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/root/root.yaml"),
    abs("specs/root/root.yaml"), _schema,
    abs("specs/root/definitions/root.json"), root,
    abs("specs/root/definitions/extended.yaml"), extended,
    abs("specs/root/definitions/name.yaml"), name
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/root/root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.first).to.equal(schema.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/root/root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
