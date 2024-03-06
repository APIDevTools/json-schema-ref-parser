import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";

import { expect } from "vitest";

describe("Blank files", () => {
  describe("main file", () => {
    it("should throw an error for a blank YAML file", async () => {
      try {
        await $RefParser.parse(path.rel("test/specs/blank/files/blank.yaml"));
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("blank/files/blank.yaml");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("is not a valid JSON Schema");
      }
    });

    it('should throw a different error if "parse.yaml.allowEmpty" is disabled', async () => {
      try {
        await $RefParser.parse(path.rel("test/specs/blank/files/blank.yaml"), {
          parse: { yaml: { allowEmpty: false } },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("blank/files/blank.yaml");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Parsed value is empty");
      }
    });

    it("should throw an error for a blank JSON file", async () => {
      try {
        await $RefParser.parse(path.rel("test/specs/blank/files/blank.json"), {
          parse: { json: { allowEmpty: false } },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("blank/files/blank.json");
      }
    });
  });

  describe("referenced files", () => {
    it("should parse successfully", async () => {
      const schema = await $RefParser.parse(path.rel("test/specs/blank/blank.yaml"));
      expect(schema).to.deep.equal(parsedSchema.schema);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/blank/blank.yaml"),
        path.abs("test/specs/blank/blank.yaml"),
        parsedSchema.schema,
        path.abs("test/specs/blank/files/blank.yaml"),
        parsedSchema.yaml,
        path.abs("test/specs/blank/files/blank.json"),
        parsedSchema.json,
        path.abs("test/specs/blank/files/blank.txt"),
        parsedSchema.text,
        path.abs("test/specs/blank/files/blank.png"),
        parsedSchema.binary,
        path.abs("test/specs/blank/files/blank.foo"),
        parsedSchema.unknown,
      ),
    );

    it("should dereference successfully", async () => {
      const schema = await $RefParser.dereference(path.rel("test/specs/blank/blank.yaml"));
      schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it("should bundle successfully", async () => {
      const schema = await $RefParser.bundle(path.rel("test/specs/blank/blank.yaml"));
      schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it('should throw an error if "allowEmpty" is disabled', async () => {
      try {
        await $RefParser.dereference(path.rel("test/specs/blank/blank.yaml"), {
          parse: { binary: { allowEmpty: false } },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error parsing ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("blank/files/blank.png");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Parsed value is empty");
      }
    });
  });
});
