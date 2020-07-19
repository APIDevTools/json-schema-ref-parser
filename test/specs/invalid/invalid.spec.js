"use strict";

const { host } = require("@jsdevtools/host-environment");
const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const { JSONParserErrorGroup, ParserError, ResolverError } = require("../../../lib/util/errors");

describe("Invalid syntax", () => {
  describe("in main file", () => {
    it("should throw an error for an invalid file path", async () => {
      try {
        await $RefParser.dereference("this file does not exist");
        helper.shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(ResolverError);
        if (host.node) {
          expect(err.ioErrorCode).to.equal("ENOENT");
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
        expect(err).to.be.an.instanceOf(ParserError);
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
        expect(err).to.be.an.instanceOf(ParserError);
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
        expect(err).to.be.an.instanceOf(ParserError);
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

    describe("when continueOnError is true", () => {
      it("should throw a grouped error for an invalid file path", async () => {
        const parser = new $RefParser();
        try {
          await parser.dereference("this file does not exist", { continueOnError: true });
          helper.shouldNotGetCalled();
        }
        catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          expect(err.files).to.equal(parser);
          expect(err.message).to.have.string("1 error occurred while reading '");
          expect(err.message).to.have.string("this file does not exist'");
          expect(err.errors.length).to.equal(1);
          expect(err.errors).to.containSubset([
            {
              name: ResolverError.name,
              message: message => message.startsWith("Error opening file") || message.endsWith("HTTP ERROR 404"),
              path: [],
              source: message => message.endsWith("this file does not exist") || message.startsWith("http://localhost"),
            }
          ]);
        }
      });

      it("should throw a grouped error for an invalid YAML file", async () => {
        const parser = new $RefParser();
        try {
          await parser.dereference(path.rel("specs/invalid/invalid.yaml"), { continueOnError: true });
          helper.shouldNotGetCalled();
        }
        catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          expect(err.files).to.equal(parser);
          expect(err.message).to.equal(`1 error occurred while reading '${path.abs("specs/invalid/invalid.yaml")}'`);
          expect(err.errors.length).to.equal(1);
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: message => (
                message.includes("invalid.yaml: incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line at line 1, column 1:")
              ),
              path: [],
              source: message => message.endsWith("test/specs/invalid/invalid.yaml"),
            },
          ]);
        }
      });

      it("should throw a grouped error for an invalid JSON file", async () => {
        const parser = new $RefParser();
        try {
          await parser.dereference(path.rel("specs/invalid/invalid.json"), { continueOnError: true });
          helper.shouldNotGetCalled();
        }
        catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          expect(err.files).to.equal(parser);
          expect(err.message).to.equal(`1 error occurred while reading '${path.abs("specs/invalid/invalid.json")}'`);
          expect(err.errors.length).to.equal(1);
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: message => (
                message.includes("invalid.json: unexpected end of the stream within a flow collection at line 2, column 1:")
              ),
              path: [],
              source: message => message.endsWith("test/specs/invalid/invalid.json"),
            }
          ]);
        }
      });

      it("should throw a grouped error for an invalid JSON file with YAML disabled", async () => {
        const parser = new $RefParser();
        try {
          await parser.dereference(path.rel("specs/invalid/invalid.json"), { continueOnError: true, parse: { yaml: false }});
          helper.shouldNotGetCalled();
        }
        catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          expect(err.files).to.equal(parser);
          expect(err.message).to.equal(`1 error occurred while reading '${path.abs("specs/invalid/invalid.json")}'`);
          expect(err.errors.length).to.equal(1);
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: message => (
                message.includes("invalid.json: Unexpected end of JSON input") ||
                message.includes("invalid.json: JSON.parse: end of data while reading object contents") ||    // Firefox
                message.includes("invalid.json: JSON Parse error: Expected '}'") ||                           // Safari
                message.includes("invalid.json: JSON.parse Error: Invalid character") ||                      // Edge
                message.includes("invalid.json: Syntax error")                                                // IE
              ),
              path: [],
              source: message => message.endsWith("test/specs/invalid/invalid.json"),
            }
          ]);
        }
      });

      it("should not throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference(path.rel("specs/invalid/invalid.yaml"), { continueOnError: true, parse: { yaml: false, json: false }});
        expect(result).to.equal(null);
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
        expect(err).to.be.an.instanceOf(ParserError);
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
        expect(err).to.be.an.instanceOf(ParserError);
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
        expect(err).to.be.an.instanceOf(ParserError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should throw a grouped error for an invalid YAML file with JSON and YAML disabled", async () => {
      const schema = await $RefParser
        .dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }}, {
          parse: { yaml: false, json: false }
        });

      // Because the JSON and YAML parsers were disabled, the invalid YAML file got parsed as plain text
      expect(schema).to.deep.equal({
        foo: ":\n"
      });
    });

    describe("when continueOnError is true", () => {
      it("should throw a grouped error for an invalid file path", async () => {
        try {
          const parser = new $RefParser();
          await parser.dereference({ foo: { $ref: "this file does not exist" }}, { continueOnError: true });
          helper.shouldNotGetCalled();
        }
        catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
          expect(err.errors.length).to.equal(1);
          expect(err.errors).to.containSubset([
            {
              name: ResolverError.name,
              message: message => message.startsWith("Error opening file") || message.endsWith("HTTP ERROR 404"),
              path: ["foo"],
              source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
            }
          ]);
        }
      });

      it("should throw a grouped error for an invalid YAML file", async () => {
        try {
          const parser = new $RefParser();
          await parser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }}, { continueOnError: true });
          helper.shouldNotGetCalled();
        }
        catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
          expect(err.errors.length).to.equal(1);
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: message => (
                message.includes("invalid.yaml: incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line at line 1, column 1:")
              ),
              path: ["foo"],
              source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
            },
          ]);
        }
      });

      it("should throw a grouped error for an invalid JSON file", async () => {
        try {
          const parser = new $RefParser();
          await parser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.json") }}, { continueOnError: true });
          helper.shouldNotGetCalled();
        }
        catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
          expect(err.errors.length).to.equal(1);
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: message => (
                message.includes("invalid.json: unexpected end of the stream within a flow collection at line 2, column 1:")
              ),
              path: ["foo"],
              source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
            }
          ]);
        }
      });

      it("should throw a grouped error for an invalid JSON file with YAML disabled", async () => {
        try {
          const parser = new $RefParser();
          await parser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.json") }}, { continueOnError: true, parse: { yaml: false }});
          helper.shouldNotGetCalled();
        }
        catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
          expect(err.errors.length).to.equal(1);
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: message => (
                message.includes("invalid.json: Unexpected end of JSON input") ||
                message.includes("invalid.json: JSON.parse: end of data while reading object contents") ||    // Firefox
                message.includes("invalid.json: JSON Parse error: Expected '}'") ||                           // Safari
                message.includes("invalid.json: JSON.parse Error: Invalid character") ||                      // Edge
                message.includes("invalid.json: Syntax error")                                                // IE
              ),
              path: ["foo"],
              source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
            }
          ]);
        }
      });

      it("should not throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
        const parser = new $RefParser();
        const result = await parser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }}, { continueOnError: true, parse: { yaml: false, json: false }});
        expect(result).to.deep.equal({ foo: ":\n" });
      });
    });
  });
});
