"use strict";

const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const { InvalidPointerError } = require("../../../lib/util/errors");

describe("Schema with invalid pointers", () => {
  it("should throw an error for invalid pointer", async () => {
    try {
      await $RefParser.dereference(path.rel("specs/invalid-pointers/invalid.json"));
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(InvalidPointerError);
      expect(err.message).to.contain("Invalid $ref pointer \"f\". Pointers must begin with \"#/\"");
    }
  });

  it("should not throw an error for invalid pointer if failFast is false", async () => {
    const parser = new $RefParser();
    const result = await parser.dereference(path.rel("specs/invalid-pointers/invalid.json"), { failFast: false });
    expect(result).to.deep.equal({ foo: null });
    expect(parser.errors).to.containSubset([
      {
        name: InvalidPointerError.name,
        message: "Invalid $ref pointer \"f\". Pointers must begin with \"#/\"",
        path: ["foo"],
        source: path.abs("specs/invalid-pointers/invalid.json"),
      }
    ]);
  });
});
