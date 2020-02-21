"use strict";

const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const { MissingPointerError } = require("../../../lib/util/errors");

describe("Schema with missing pointers", () => {
  it("should throw an error for missing pointer", async () => {
    try {
      await $RefParser.dereference({ foo: { $ref: "#/baz" }});
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(MissingPointerError);
      expect(err.message).to.contain("Token \"baz\" does not exist.");
    }
  });

  it("should not throw an error for missing pointer if failFast is false", async () => {
    const parser = new $RefParser();
    const result = await parser.dereference({ foo: { $ref: "#/baz" }}, { failFast: false });
    expect(result).to.deep.equal({ foo: null });
    expect(parser.errors).to.containSubset([
      {
        name: MissingPointerError.name,
        message: "Token \"baz\" does not exist.",
        path: ["foo"],
        source: expectedValue => expectedValue.endsWith("/test/"),
      }
    ]);
  });
});
