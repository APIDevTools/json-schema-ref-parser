import { expect } from "chai";
import $RefParser from "../../../lib/index";
import { testResolve } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { schema as _schema, name, requiredString } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("Schema with deeply-nested $refs", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/deep/deep.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/deep/deep.yaml")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/deep/deep.yaml"),
    abs("specs/deep/deep.yaml"), _schema,
    abs("specs/deep/definitions/name.yaml"), name,
    abs("specs/deep/definitions/required-string.yaml"), requiredString
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/deep/deep.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.name.type)
      .to.equal(schema.properties["level 1"].properties.name.type)
      .to.equal(schema.properties["level 1"].properties["level 2"].properties.name.type)
      .to.equal(schema.properties["level 1"].properties["level 2"].properties["level 3"].properties.name.type)
      .to.equal(schema.properties["level 1"].properties["level 2"].properties["level 3"].properties["level 4"].properties.name.type);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/deep/deep.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
