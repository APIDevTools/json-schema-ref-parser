"use strict";

const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../..");
const { JSONParserErrorGroup, MissingPointerError } = require("../../../lib/util/errors");
const helper = require("../../utils/helper");

describe("Schema with missing pointers", () => {
  it("should throw an error for missing pointer", async () => {
    try {
      await $RefParser.dereference({ foo: { $ref: "#/baz" }});
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(MissingPointerError);
      expect(err.message).to.equal('at "#/foo", token "baz" in "#/baz" does not exist');
    }
  });

  it("should throw a grouped error for missing pointer if continueOnError is true", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference({ foo: { $ref: "#/baz" }}, { continueOnError: true });
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      expect(err.files).to.equal(parser);
      expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
      expect(err.message).to.have.string("1 error occurred while reading '");
      console.log(err.errors[0].source);

      expect(err.errors).to.containSubset([
        {
          name: MissingPointerError.name,
          message: 'at "#/foo", token "baz" in "#/baz" does not exist',
          path: ["foo"],
        }
      ]);
    }
  });
});
