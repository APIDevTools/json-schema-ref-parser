import { expect } from "chai";
import $RefParser from "../../..";
import { testResolve } from "../../utils/helper";
import { abs, rel, url } from "../../utils/path";
import { schema as _schema, definitions, name, requiredString } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("Schema with external $refs", () => {
  it("should parse successfully from an absolute path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(abs("specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/external/external.yaml")]);
  });

  it("should parse successfully from a relative path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/external/external.yaml")]);
  });

  it("should parse successfully from a url", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(url("specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([url("specs/external/external.yaml")]);
  });

  it("should resolve successfully from an absolute path", testResolve(
    abs("specs/external/external.yaml"),
    abs("specs/external/external.yaml"), _schema,
    abs("specs/external/definitions/definitions.json"), definitions,
    abs("specs/external/definitions/name.yaml"), name,
    abs("specs/external/definitions/required-string.yaml"), requiredString
  ));

  it("should resolve successfully from a relative path", testResolve(
    rel("specs/external/external.yaml"),
    abs("specs/external/external.yaml"), _schema,
    abs("specs/external/definitions/definitions.json"), definitions,
    abs("specs/external/definitions/name.yaml"), name,
    abs("specs/external/definitions/required-string.yaml"), requiredString
  ));

  it("should resolve successfully from a url", testResolve(
    url("specs/external/external.yaml"),
    url("specs/external/external.yaml"), _schema,
    url("specs/external/definitions/definitions.json"), definitions,
    url("specs/external/definitions/name.yaml"), name,
    url("specs/external/definitions/required-string.yaml"), requiredString
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.name).to.equal(schema.definitions.name);
    expect(schema.definitions["required string"])
      .to.equal(schema.definitions.name.properties.first)
      .to.equal(schema.definitions.name.properties.last)
      .to.equal(schema.properties.name.properties.first)
      .to.equal(schema.properties.name.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
