import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import { JSONParserErrorGroup, ParserError, ResolverError } from "../../../lib/util/errors.js";

// @ts-expect-error TS(2345): Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
const isWindows = /^win/.test(globalThis.process ? globalThis.process.platform : undefined);
const getPathFromOs = (filePath: any) => (isWindows ? filePath.replace(/\\/g, "/") : filePath);

describe("Invalid syntax", () => {
  describe("in main file", () => {
    it("should throw an error for an invalid file path", async () => {
      try {
        await $RefParser.dereference("this file does not exist");
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(ResolverError);
        if (typeof window === "undefined") {
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.ioErrorCode).to.equal("ENOENT");
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.message).to.contain("Error opening file ");
        }
      }
    });

    it("should throw an error for an invalid YAML file", async () => {
      try {
        await $RefParser.dereference(path.rel("test/specs/invalid/invalid.yaml"));
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(ParserError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("invalid/invalid.yaml");
      }
    });

    it("should throw an error for an invalid JSON file", async () => {
      try {
        await $RefParser.dereference(path.rel("test/specs/invalid/invalid.json"));
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(ParserError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should throw an error for an invalid JSON file with YAML disabled", async () => {
      try {
        await $RefParser.dereference(path.rel("test/specs/invalid/invalid.json"), { parse: { yaml: false } });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(ParserError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
      try {
        await $RefParser.dereference(path.rel("test/specs/invalid/invalid.yaml"), {
          parse: { yaml: false, json: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain('invalid/invalid.yaml" is not a valid JSON Schema');
      }
    });

    describe("when continueOnError is true", () => {
      it("should throw a grouped error for an invalid file path", async () => {
        const parser = new $RefParser();
        try {
          await parser.dereference("this file does not exist", { continueOnError: true });
          helper.shouldNotGetCalled();
        } catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.files).to.equal(parser);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.message).to.have.string("1 error occurred while reading '");
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.message).to.have.string("this file does not exist'");
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors.length).to.equal(1);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors).to.containSubset([
            {
              name: ResolverError.name,
              message: (message: any) => message.startsWith("Error opening file") || message.endsWith("HTTP ERROR 404"),
              path: [],
              source: (message: any) =>
                message.endsWith("this file does not exist") || message.startsWith("http://localhost"),
            },
          ]);
        }
      });

      it("should throw a grouped error for an invalid YAML file", async () => {
        const parser = new $RefParser();
        try {
          await parser.dereference(path.rel("test/specs/invalid/invalid.yaml"), { continueOnError: true });
          helper.shouldNotGetCalled();
        } catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.files).to.equal(parser);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(getPathFromOs(err.message)).to.equal(
            `1 error occurred while reading '${path.abs("test/specs/invalid/invalid.yaml")}'`,
          );
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors.length).to.equal(1);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: (message: any) =>
                message.includes(
                  "invalid.yaml: incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line (1:1)",
                ),
              path: [],
              source: (message: any) => message.endsWith("test/specs/invalid/invalid.yaml"),
            },
          ]);
        }
      });

      it("should throw a grouped error for an invalid JSON file", async () => {
        const parser = new $RefParser();
        try {
          await parser.dereference(path.rel("test/specs/invalid/invalid.json"), { continueOnError: true });
          helper.shouldNotGetCalled();
        } catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.files).to.equal(parser);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(getPathFromOs(err.message)).to.equal(
            `1 error occurred while reading '${path.abs("test/specs/invalid/invalid.json")}'`,
          );
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors.length).to.equal(1);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: (message: any) =>
                message.includes("invalid.json: unexpected end of the stream within a flow collection (2:1)"),
              path: [],
              source: (message: any) => message.endsWith("test/specs/invalid/invalid.json"),
            },
          ]);
        }
      });

      it("should throw a grouped error for an invalid JSON file with YAML disabled", async () => {
        const parser = new $RefParser();
        try {
          await parser.dereference(path.rel("test/specs/invalid/invalid.json"), {
            continueOnError: true,
            parse: { yaml: false },
          });
          helper.shouldNotGetCalled();
        } catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.files).to.equal(parser);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(getPathFromOs(err.message)).to.equal(
            `1 error occurred while reading '${path.abs("test/specs/invalid/invalid.json")}'`,
          );
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors.length).to.equal(1);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: (message: any) =>
                message.includes("invalid.json: Unexpected end of JSON input") ||
                message.includes("invalid.json: Expected property name or '}' in JSON") ||
                message.includes("invalid.json: JSON.parse: end of data while reading object contents") || // Firefox
                message.includes("invalid.json: JSON Parse error: Expected '}'") || // Safari
                message.includes("invalid.json: JSON.parse Error: Invalid character") || // Edge
                message.includes("invalid.json: Syntax error") || // IE
                message.includes("invalid.json: Expected property name or '}' in JSON"), // Chrome
              path: [],
              source: (message: any) => message.endsWith("test/specs/invalid/invalid.json"),
            },
          ]);
        }
      });

      it("should not throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
        const parser = new $RefParser();

        const result = await parser.dereference(path.rel("test/specs/invalid/invalid.yaml"), {
          continueOnError: true,
          parse: { yaml: false, json: false },
        });
        expect(result).to.equal(null);
      });
    });
  });

  describe("in referenced files", () => {
    it("should throw an error for an invalid YAML file", async () => {
      try {
        await $RefParser.dereference({ foo: { $ref: path.rel("test/specs/invalid/invalid.yaml") } });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(ParserError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("invalid/invalid.yaml");
      }
    });

    it("should throw an error for an invalid JSON file", async () => {
      try {
        await $RefParser.dereference({ foo: { $ref: path.rel("test/specs/invalid/invalid.json") } });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(ParserError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should throw an error for an invalid JSON file with YAML disabled", async () => {
      try {
        await $RefParser.dereference(
          { foo: { $ref: path.rel("test/specs/invalid/invalid.json") } },
          {
            parse: { yaml: false },
          },
        );
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(ParserError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("invalid/invalid.json");
      }
    });

    it("should throw a grouped error for an invalid YAML file with JSON and YAML disabled", async () => {
      const schema = await $RefParser.dereference(
        { foo: { $ref: path.rel("test/specs/invalid/invalid.yaml") } },
        {
          parse: { yaml: false, json: false },
        },
      );

      // Because the JSON and YAML parsers were disabled, the invalid YAML file got parsed as plain text
      expect(schema).to.deep.equal({
        foo: ":\n",
      });
    });

    describe("when continueOnError is true", () => {
      it("should throw a grouped error for an invalid file path", async () => {
        try {
          const parser = new $RefParser();

          await parser.dereference({ foo: { $ref: "this file does not exist" } }, { continueOnError: true });
          helper.shouldNotGetCalled();
        } catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors.length).to.equal(1);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors).to.containSubset([
            {
              name: ResolverError.name,
              message: (message: any) => message.startsWith("Error opening file") || message.endsWith("HTTP ERROR 404"),
              path: ["foo"],
              // source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
            },
          ]);
        }
      });

      it("should throw a grouped error for an invalid YAML file", async () => {
        try {
          const parser = new $RefParser();

          await parser.dereference(
            { foo: { $ref: path.rel("test/specs/invalid/invalid.yaml") } },
            { continueOnError: true },
          );
          helper.shouldNotGetCalled();
        } catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors.length).to.equal(1);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: (message: any) =>
                message.includes(
                  "invalid.yaml: incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line (1:1)",
                ),
              path: ["foo"],
              // source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
            },
          ]);
        }
      });

      it("should throw a grouped error for an invalid JSON file", async () => {
        try {
          const parser = new $RefParser();

          await parser.dereference(
            { foo: { $ref: path.rel("test/specs/invalid/invalid.json") } },
            { continueOnError: true },
          );
          helper.shouldNotGetCalled();
        } catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors.length).to.equal(1);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: (message: any) =>
                message.includes("invalid.json: unexpected end of the stream within a flow collection (2:1)"),
              path: ["foo"],
              // source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
            },
          ]);
        }
      });

      it("should throw a grouped error for an invalid JSON file with YAML disabled", async () => {
        try {
          const parser = new $RefParser();

          await parser.dereference(
            { foo: { $ref: path.rel("test/specs/invalid/invalid.json") } },
            { continueOnError: true, parse: { yaml: false } },
          );
          helper.shouldNotGetCalled();
        } catch (err) {
          expect(err).to.be.instanceof(JSONParserErrorGroup);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.files.$refs._root$Ref.value).to.deep.equal({ foo: null });
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors.length).to.equal(1);
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.errors).to.containSubset([
            {
              name: ParserError.name,
              message: (message: any) =>
                message.includes("invalid.json: Unexpected end of JSON input") ||
                message.includes("invalid.json: Expected property name or '}' in JSON") ||
                message.includes("invalid.json: JSON.parse: end of data while reading object contents") || // Firefox
                message.includes("invalid.json: JSON Parse error: Expected '}'") || // Safari
                message.includes("invalid.json: JSON.parse Error: Invalid character") || // Edge
                message.includes("invalid.json: Syntax error") || // IE
                message.includes("invalid.json: Expected property name or '}' in JSON"), // Chrome
              path: ["foo"],
              // source: message => message.endsWith("/test/") || message.startsWith("http://localhost"),
            },
          ]);
        }
      });

      it("should not throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
        const parser = new $RefParser();

        const result = await parser.dereference(
          { foo: { $ref: path.rel("test/specs/invalid/invalid.yaml") } },
          { continueOnError: true, parse: { yaml: false, json: false } },
        );
        expect(result).to.deep.equal({ foo: ":\n" });
      });
    });
  });
});
