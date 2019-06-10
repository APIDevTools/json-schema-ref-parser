"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../fixtures/helper");
const path = require("../../fixtures/path");

describe("multiple circular $refs at the same depth in the schema", () => {
  it("should bundle successfully", function () {
    let parser = new $RefParser();

    return parser
      .bundle(path.rel("specs/circular-multi/definitions/root.json"))
      .then(function (schema) {
        expect(schema).to.deep.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.circularMulti);
      });
  });
});
