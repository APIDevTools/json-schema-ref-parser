"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const bundledSchema = require("./bundled");

describe("Schema with $refs to parts of external files", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/skip-internal/skip-internal.yaml"), { resolve: { skipInternal: true } });
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/skip-internal/skip-internal.yaml")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/skip-internal/skip-internal.yaml"),
    path.abs("specs/skip-internal/skip-internal.yaml"), parsedSchema.schema,
    path.abs("specs/skip-internal/definitions/definitions.json"), parsedSchema.definitions,
    path.abs("specs/skip-internal/definitions/name.yaml"), parsedSchema.name,
    path.abs("specs/skip-internal/definitions/required-string.yaml"), parsedSchema.requiredString
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/skip-internal/skip-internal.yaml"), { resolve: { skipInternal: true } });
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/skip-internal/skip-internal.yaml"), { resolve: { skipInternal: true } });
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
