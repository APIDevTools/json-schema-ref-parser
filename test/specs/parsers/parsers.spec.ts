import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import { JSONParserErrorGroup, ParserError, UnmatchedParserError } from "../../../lib/util/errors.js";
import type { Options } from "../../../lib/options";
import type { ParserOptions } from "../../../lib/options";

describe("References to non-JSON files", () => {
  const baseUrl = path.rel("test/specs/parsers/parsers.yaml");
  it("should parse successfully", async () => {
    const schema = await $RefParser.parse(baseUrl);
    expect(schema).to.deep.equal(parsedSchema.schema);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      baseUrl,
      path.abs("test/specs/parsers/parsers.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/parsers/files/README.md"),
      dereferencedSchema.defaultParsers.definitions.markdown,
      path.abs("test/specs/parsers/files/page.html"),
      dereferencedSchema.defaultParsers.definitions.html,
      path.abs("test/specs/parsers/files/style.css"),
      dereferencedSchema.defaultParsers.definitions.css,
      path.abs("test/specs/parsers/files/binary.png"),
      dereferencedSchema.defaultParsers.definitions.binary,
      path.abs("test/specs/parsers/files/unknown.foo"),
      dereferencedSchema.defaultParsers.definitions.unknown,
      path.abs("test/specs/parsers/files/empty"),
      dereferencedSchema.defaultParsers.definitions.empty,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(baseUrl);
    expect(schema).to.equal(parser.schema);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const schema = await $RefParser.bundle(baseUrl);
    schema.definitions!.binary = helper.convertNodeBuffersToPOJOs(schema.definitions!.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
  });

  it('should parse text as binary if "parse.text" is disabled', async () => {
    const opts = {
      parse: {
        // Disable the text parser
        text: false,
        // Parse all non-YAML files as binary
        binary: {
          canParse(file: any) {
            return file.url.substr(-5) !== ".yaml";
          },
        },
      },
    } as Options;
    const schema = await $RefParser.dereference(baseUrl, opts);
    const definitions = schema.definitions!;
    definitions.markdown = helper.convertNodeBuffersToPOJOs(definitions.markdown);
    definitions.html = helper.convertNodeBuffersToPOJOs(definitions.html);
    definitions.css = helper.convertNodeBuffersToPOJOs(definitions.css);
    definitions.binary = helper.convertNodeBuffersToPOJOs(definitions.binary);
    definitions.unknown = helper.convertNodeBuffersToPOJOs(definitions.unknown);
    definitions.empty = helper.convertNodeBuffersToPOJOs(definitions.empty);
    expect(schema).to.deep.equal(dereferencedSchema.binaryParser);
  });

  it("should throw an error if no parser can be matched", async () => {
    try {
      await $RefParser.dereference(baseUrl, {
        parse: {
          yaml: false,
          json: false,
          text: false,
          binary: false,
        },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Unable to parse ");
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("parsers/parsers.yaml");
    }
  });

  it("should throw an error if no parser returned a result", async () => {
    try {
      await $RefParser.dereference(baseUrl, {
        parse: {
          yaml: {
            canParse: true,
            parse() {
              return;
            },
          },
          json: false,
          text: false,
          binary: false,
        },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      // would time out otherwise
      expect(err).to.be.an.instanceOf(ParserError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("No promise has been returned or callback has been called.");
    }
  });

  it('should throw an error if "parse.text" and "parse.binary" are disabled', async () => {
    try {
      await $RefParser.dereference(baseUrl, {
        parse: { text: false, binary: false },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(ParserError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Error parsing ");
    }
  });

  it("should use a custom parser with static values", async () => {
    const schema = await $RefParser.dereference(baseUrl, {
      parse: {
        // A custom parser that always returns the same value
        staticParser: {
          order: 201,
          canParse: true,
          parse: "The quick brown fox jumped over the lazy dog",
        },
      },
    } as ParserOptions);
    expect(schema).to.deep.equal(dereferencedSchema.staticParser);
  });

  it("should use a custom parser that returns a value", async () => {
    const schema = await $RefParser.dereference(baseUrl, {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse(file: any) {
            return file.url.substr(-4) === ".foo";
          },
          parse(file: any) {
            return file.data.toString().split("").reverse().join("");
          },
        },
      },
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it("should use a custom parser that calls a callback", async () => {
    const schema = await $RefParser.dereference(baseUrl, {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse: /\.FOO$/i,
          parse(file: any, callback: any) {
            const reversed = file.data.toString().split("").reverse().join("");
            callback(null, reversed);
          },
        },
      },
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it("should use a custom parser that returns a promise", async () => {
    const schema = await $RefParser.dereference(baseUrl, {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse: [".foo"],
          async parse(file: any) {
            const reversed = await new Promise((resolve) => {
              resolve(file.data.toString().split("").reverse().join(""));
            });
            return reversed;
          },
        },
      },
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it("should continue parsing if a custom parser fails", async () => {
    const schema = await $RefParser.dereference(baseUrl, {
      parse: {
        // A custom parser that always fails,
        // so the built-in parsers will be used as a fallback
        badParser: {
          order: 1,
          canParse: /\.(md|html|css|png)$/i,
          parse(file: any, callback: any) {
            callback("BOMB!!!");
          },
        },
      },
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
  });

  it("should normalize errors thrown by parsers", async () => {
    try {
      await $RefParser.dereference(baseUrl, {
        parse: {
          // A custom parser that always fails,
          // so the built-in parsers will be used as a fallback
          yaml: {
            order: 1,
            parse() {
              throw new Error("Woops");
            },
          },
        },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.instanceof(ParserError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Error parsing");
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("arsers/parsers.yaml: Woops");
    }
  });

  it("should throw a grouped error if no parser can be matched and continueOnError is true", async () => {
    try {
      const parser = new $RefParser();

      await parser.dereference(baseUrl, {
        parse: {
          yaml: false,
          json: false,
          text: false,
          binary: false,
        },
        continueOnError: true,
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.errors.length).to.equal(1);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.errors).to.containSubset([
        {
          name: UnmatchedParserError.name,
          message: (message: any) => message.startsWith("Could not find parser for"),
          path: [],
          source: (message: any) =>
            message.endsWith("specs/parsers/parsers.yaml") || message.startsWith("http://localhost"),
        },
      ]);
    }
  });
});
