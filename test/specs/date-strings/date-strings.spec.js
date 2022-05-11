"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");

describe("Schema with date strings", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/date-strings/date-strings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/date-strings/date-strings.yaml")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/date-strings/date-strings.yaml"),
    path.abs("specs/date-strings/date-strings.yaml"), parsedSchema.schema,
  ));
});
