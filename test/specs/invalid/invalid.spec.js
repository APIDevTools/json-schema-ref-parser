"use strict";

const { host } = require("host-environment");
const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const { StoplightParserError, ParserError } = require("../../../lib/util/errors");

describe("Invalid syntax", () => {
  describe("in main file", () => {
    it("should throw an error for an invalid file path", async () => {
      try {
        await $RefParser.dereference("this file does not exist");
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        if (host.node) {
          expect(err.code).to.equal("ENOENT");
          expect(err.message).to.contain("Error opening file ");
        }
      }
    });

    it("should throw an error for an invalid YAML file", async () => {
      try {
        await $RefParser.dereference(path.rel("specs/invalid/invalid.yaml"));
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(StoplightParserError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("invalid/invalid.yaml");
      }
    });

    it("should throw an error for an invalid JSON file", async () => {
      try {
        await $RefParser.dereference(path.rel("specs/invalid/invalid.json"));
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(StoplightParserError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should throw an error for an invalid JSON file with YAML disabled", async () => {
      try {
        await $RefParser.dereference(path.rel("specs/invalid/invalid.json"), { parse: { yaml: false }});
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(StoplightParserError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
      try {
        await $RefParser.dereference(path.rel("specs/invalid/invalid.yaml"), { parse: { yaml: false, json: false }});
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('invalid/invalid.yaml" is not a valid JSON Schema');
      }
    });

    describe("when failFast is false", () => {
      it("should not throw an error for an invalid YAML file", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference(path.rel("specs/invalid/invalid.yaml"), { failFast: false });
        expect(result).to.be.null;
        expect(parser.errors.length).to.equal(1);
        expect(parser.errors).to.containSubset([
          {
            name: ParserError.name,
            message: "incomplete explicit mapping pair; a key node is missed",
            path: [],
            source: expectedValue => expectedValue.endsWith("test/specs/invalid/invalid.yaml"),
          },
        ]);
      });

      it("should not throw an error for an invalid JSON file", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference(path.rel("specs/invalid/invalid.json"), { failFast: false });
        expect(result).to.be.null;
        expect(parser.errors.length).to.equal(1);
        expect(parser.errors).to.containSubset([
          {
            name: ParserError.name,
            message: "unexpected end of the stream within a flow collection",
            path: [],
            source: expectedValue => expectedValue.endsWith("test/specs/invalid/invalid.json"),
          }
        ]);
      });

      it("should not throw an error for an invalid JSON file with YAML disabled", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference(path.rel("specs/invalid/invalid.json"), { failFast: false, parse: { yaml: false }});
        expect(result).to.be.null;
        expect(parser.errors.length).to.equal(1);
        expect(parser.errors).to.containSubset([
          {
            name: ParserError.name,
            message: "CloseBraceExpected",
            path: [],
            source: expectedValue => expectedValue.endsWith("test/specs/invalid/invalid.json"),
          }
        ]);
      });

      it("should not throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference(path.rel("specs/invalid/invalid.yaml"), { failFast: false, parse: { yaml: false, json: false }});
        expect(result).to.be.null;
        expect(parser.errors).to.deep.equal([]);
      });
    });
  });

  describe("in referenced files", () => {
    it("should throw an error for an invalid YAML file", async () => {
      try {
        await $RefParser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }});
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(StoplightParserError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("invalid/invalid.yaml");
      }
    });

    it("should throw an error for an invalid JSON file", async () => {
      try {
        await $RefParser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.json") }});
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(StoplightParserError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should throw an error for an invalid JSON file with YAML disabled", async () => {
      try {
        await $RefParser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.json") }}, {
          parse: { yaml: false }
        });
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(StoplightParserError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should NOT throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
      const schema = await $RefParser
        .dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }}, {
          parse: { yaml: false, json: false }
        });

      // Because the JSON and YAML parsers were disabled, the invalid YAML file got parsed as plain text
      expect(schema).to.deep.equal({
        foo: ":\n"
      });
    });

    describe("when failFast is false", () => {
      it("should not throw an error for an invalid YAML file", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }}, { failFast: false });
        expect(parser.errors.length).to.equal(1);
        expect(parser.errors).to.containSubset([
          {
            name: ParserError.name,
            message: "incomplete explicit mapping pair; a key node is missed",
            path: ["foo"],
            source: expectedValue => expectedValue.endsWith("/test/"),
          },
        ]);
      });

      it("should not throw an error for an invalid JSON file", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.json") }}, { failFast: false });
        expect(parser.errors).to.containSubset([
          {
            name: ParserError.name,
            message: "unexpected end of the stream within a flow collection",
            path: ["foo"],
            source: expectedValue => expectedValue.endsWith("/test/"),
          }
        ]);
      });

      it("should not throw an error for an invalid JSON file with YAML disabled", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.json") }}, { failFast: false, parse: { yaml: false }});
        expect(parser.errors).to.containSubset([
          {
            name: ParserError.name,
            message: "CloseBraceExpected",
            path: ["foo"],
            source: expectedValue => expectedValue.endsWith("/test/"),
          }
        ]);
      });

      it("should not throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }}, { failFast: false, parse: { yaml: false, json: false }});
        expect(result).to.deep.equal({ foo: ":\n" });
        expect(parser.errors).to.deep.equal([]);
      });
    });
  });
});
