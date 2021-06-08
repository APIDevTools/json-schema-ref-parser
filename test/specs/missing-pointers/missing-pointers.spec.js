"use strict";

const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../../lib");
const { JSONParserErrorGroup, MissingPointerError } = require("../../../lib/util/errors");
const helper = require("../../utils/helper");
const path = require("../../utils/path");

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

  it("should throw an error for missing pointer in external file", async () => {
    try {
      await $RefParser.dereference({ foo: { $ref: path.abs("specs/missing-pointers/external-from-internal.yaml") }});
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(MissingPointerError);
      expect(err.message).to.contain("Token \"external\" does not exist.");
    }
  });

  context("when continueOnError is true", () => {
    it("should throw a grouped error for missing pointer", async () => {
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
        expect(err.errors).to.containSubset([
          {
            name: MissingPointerError.name,
            message: "Token \"baz\" does not exist.",
            path: ["foo"],
            source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
          }
        ]);
      }
    });

    it("should throw an error for missing pointer in external file", async () => {
      const parser = new $RefParser();
      try {
        await parser.dereference({ foo: { $ref: path.abs("specs/missing-pointers/external-from-internal.yaml") }}, { continueOnError: true });
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.instanceof(JSONParserErrorGroup);
        expect(err.files).to.equal(parser);
        expect(err.files.$refs._root$Ref.value).to.deep.equal({
          foo: {
            internal1: null,
            internal2: null,
          }
        });
        expect(err.message).to.have.string("1 error occurred while reading '");
        expect(err.errors).to.containSubset([
          {
            name: MissingPointerError.name,
            message: "Token \"external\" does not exist.",
            path: ["internal2"],
            source: message => message.endsWith("missing-pointers/external-from-internal.yaml") || message.startsWith("http://localhost"),
          }
        ]);
      }
    });
  });
});
