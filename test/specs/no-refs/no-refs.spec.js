"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../fixtures/helper");
const path = require("../../fixtures/path");

describe("Schema without any $refs", () => {
  it("should parse successfully", function () {
    let parser = new $RefParser();
    return parser
      .parse(path.rel("specs/no-refs/no-refs.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);
        expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/no-refs/no-refs.yaml")]);
      });
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/no-refs/no-refs.yaml"),
    path.abs("specs/no-refs/no-refs.yaml"), helper.parsed.noRefs
  ));

  it("should dereference successfully", function () {
    let parser = new $RefParser();
    return parser
      .dereference(path.rel("specs/no-refs/no-refs.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it("should bundle successfully", function () {
    let parser = new $RefParser();
    return parser
      .bundle(path.rel("specs/no-refs/no-refs.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.noRefs);
      });
  });
});
