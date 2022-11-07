import { expect } from "chai";
import $RefParser from "../../..";
import { testResolve } from "../../utils/helper";
import { abs, rel, url } from "../../utils/path";
import { schema as _schema, definitions } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

/**
 * This test is from PR #62
 * https://github.com/APIDevTools/json-schema-ref-parser/pull/62
 */
describe("Schema with two external refs to the same value and internal ref before", () => {
  it("should parse successfully from an absolute path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(abs("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/external-from-internal/external-from-internal.yaml")]);
  });

  it("should parse successfully from a relative path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/external-from-internal/external-from-internal.yaml")]);
  });

  it("should parse successfully from a url", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(url("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([url("specs/external-from-internal/external-from-internal.yaml")]);
  });

  it("should resolve successfully from an absolute path", testResolve(
    abs("specs/external-from-internal/external-from-internal.yaml"),
    abs("specs/external-from-internal/external-from-internal.yaml"), _schema,
    abs("specs/external-from-internal/definitions.yaml"), definitions
  ));

  it("should resolve successfully from a relative path", testResolve(
    rel("specs/external-from-internal/external-from-internal.yaml"),
    abs("specs/external-from-internal/external-from-internal.yaml"), _schema,
    abs("specs/external-from-internal/definitions.yaml"), definitions
  ));

  it("should resolve successfully from a url", testResolve(
    url("specs/external-from-internal/external-from-internal.yaml"),
    url("specs/external-from-internal/external-from-internal.yaml"), _schema,
    url("specs/external-from-internal/definitions.yaml"), definitions
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.internal1).to.equal(schema.internal2);
    expect(schema.internal2).to.equal(schema.external1);
    expect(schema.internal3).to.equal(schema.internal4);
    expect(schema.internal4).to.equal(schema.external2);
    expect(schema.internal1.test)
      .to.equal(schema.internal2.test)
      .to.equal(schema.internal3.test)
      .to.equal(schema.internal4.test)
      .to.equal(schema.external1.test)
      .to.equal(schema.external2.test);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
