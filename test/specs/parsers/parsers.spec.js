"use strict";

const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");
const { JSONParserErrorGroup, ParserError, UnmatchedParserError } = require("../../../lib/util/errors");

describe("References to non-JSON files", () => {
  it("should parse successfully", async () => {
    const schema = await $RefParser
      .parse(path.rel("specs/parsers/parsers.yaml"));
    expect(schema).to.deep.equal(parsedSchema.schema);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/parsers/parsers.yaml"),
    path.abs("specs/parsers/parsers.yaml"), parsedSchema.schema,
    path.abs("specs/parsers/files/README.md"), dereferencedSchema.defaultParsers.definitions.markdown,
    path.abs("specs/parsers/files/page.html"), dereferencedSchema.defaultParsers.definitions.html,
    path.abs("specs/parsers/files/style.css"), dereferencedSchema.defaultParsers.definitions.css,
    path.abs("specs/parsers/files/unknown.foo"), dereferencedSchema.defaultParsers.definitions.unknown,
    path.abs("specs/parsers/files/empty"), dereferencedSchema.defaultParsers.definitions.empty
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/parsers/parsers.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const schema = await $RefParser
      .bundle(path.rel("specs/parsers/parsers.yaml"));
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
  });

  it("should throw an error if no no parser can be matched", async () => {
    try {
      await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
        parse: {
          yaml: false,
          json: false,
          text: false,
        },
      });
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      expect(err.message).to.contain("Unable to parse ");
      expect(err.message).to.contain("parsers/parsers.yaml");
    }
  });

  it('should throw an error if "parse.text" is disabled', async () => {
    try {
      await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), { parse: { text: false }});
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(ParserError);
      expect(err.message).to.contain("Error parsing ");
    }
  });

  it("should use a custom parser with static values", async () => {
    const schema = await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
      parse: {
        // A custom parser that always returns the same value
        staticParser: {
          order: 201,
          canParse: true,
          parse: "The quick brown fox jumped over the lazy dog"
        }
      }
    });
    expect(schema).to.deep.equal(dereferencedSchema.staticParser);
  });

  it("should use a custom parser that returns a value", async () => {
    const schema = await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse (file) {
            return file.url.substr(-4) === ".foo";
          },
          parse (file) {
            return new TextDecoder().decode(file.data).split("").reverse().join("");
          }
        }
      }
    });
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it("should use a custom parser that calls a callback", async () => {
    const schema = await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse: /\.FOO$/i,
          parse (file, callback) {
            let reversed = new TextDecoder().decode(file.data).split("").reverse().join("");
            callback(null, reversed);
          }
        }
      }
    });
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it("should use a custom parser that returns a promise", async () => {
    const schema = await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse: [".foo"],
          async parse (file) {
            let reversed = await new Promise((resolve) => {
              resolve(new TextDecoder().decode(file.data).split("").reverse().join(""));
            });
            return reversed;
          }
        }
      }
    });
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it("should continue parsing if a custom parser fails", async () => {
    const schema = await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
      parse: {
        // A custom parser that always fails,
        // so the built-in parsers will be used as a fallback
        badParser: {
          order: 1,
          canParse: /\.(md|html|css|png)$/i,
          parse (file, callback) {
            callback("BOMB!!!");
          }
        }
      }
    });
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
  });

  it("should normalize errors thrown by parsers", async () => {
    try {
      await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
        parse: {
          // A custom parser that always fails,
          // so the built-in parsers will be used as a fallback
          yaml: {
            order: 1,
            parse () {
              throw new Error("Woops");
            }
          }
        }
      });
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.instanceof(ParserError);
      expect(err.message).to.contain("Error parsing");
      expect(err.message).to.contain("parsers/parsers.yaml: Woops");
    }
  });

  it("should throw a grouped error if no parser can be matched and continueOnError is true", async () => {
    try {
      const parser = new $RefParser();
      await parser.dereference(path.rel("specs/parsers/parsers.yaml"), {
        parse: {
          yaml: false,
          json: false,
          text: false,
        },
        continueOnError: true,
      });
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      expect(err.errors.length).to.equal(1);
      expect(err.errors).to.containSubset([
        {
          name: UnmatchedParserError.name,
          message: message => message.startsWith("Could not find parser for"),
          path: [],
          source: message => message.endsWith("specs/parsers/parsers.yaml") || message.startsWith("http://localhost"),
        },
      ]);
    }
  });
});
