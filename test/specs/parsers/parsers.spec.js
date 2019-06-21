"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");

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
    path.abs("specs/parsers/files/binary.png"), dereferencedSchema.defaultParsers.definitions.binary,
    path.abs("specs/parsers/files/unknown.foo"), dereferencedSchema.defaultParsers.definitions.unknown,
    path.abs("specs/parsers/files/empty"), dereferencedSchema.defaultParsers.definitions.empty
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/parsers/parsers.yaml"));
    expect(schema).to.equal(parser.schema);
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const schema = await $RefParser
      .bundle(path.rel("specs/parsers/parsers.yaml"));
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
  });

  it('should parse text as binary if "parse.text" is disabled', async () => {
    const schema = await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
      parse: {
        // Disable the text parser
        text: false,
        // Parse all non-YAML files as binary
        binary: {
          canParse (file) {
            return file.url.substr(-5) !== ".yaml";
          }
        }
      }
    });
    schema.definitions.markdown = helper.convertNodeBuffersToPOJOs(schema.definitions.markdown);
    schema.definitions.html = helper.convertNodeBuffersToPOJOs(schema.definitions.html);
    schema.definitions.css = helper.convertNodeBuffersToPOJOs(schema.definitions.css);
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    schema.definitions.unknown = helper.convertNodeBuffersToPOJOs(schema.definitions.unknown);
    schema.definitions.empty = helper.convertNodeBuffersToPOJOs(schema.definitions.empty);
    expect(schema).to.deep.equal(dereferencedSchema.binaryParser);
  });

  it('should throw an error if "parse.text" and "parse.binary" are disabled', async () => {
    try {
      await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), { parse: { text: false, binary: false }});
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
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
            return file.data.toString().split("").reverse().join("");
          }
        }
      }
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it("should use a custom parser that calls a callback", async () => {
    const schema = await $RefParser.dereference(path.rel("specs/parsers/parsers.yaml"), {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse: /\.FOO$/i,
          parse (file, callback) {
            let reversed = file.data.toString().split("").reverse().join("");
            callback(null, reversed);
          }
        }
      }
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
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
              resolve(file.data.toString().split("").reverse().join(""));
            });
            return reversed;
          }
        }
      }
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
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
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
  });

});
