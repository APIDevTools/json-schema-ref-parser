import { expect, describe, it } from "vitest";
import $RefParser from "../../../lib";
import helper from "../../utils/helper";
import path from "../../utils/path";
import { InvalidPointerError, JSONParserErrorGroup } from "../../../lib/util/errors";

describe("Schema with invalid pointers", () => {
  it("should throw an error for an invalid pointer", async () => {
    try {
      await $RefParser.dereference(path.rel("test/specs/invalid-pointers/invalid.json"));
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(InvalidPointerError);
      expect((err as InvalidPointerError).message).to.contain(
        'Invalid $ref pointer "f". Pointers must begin with "#/"',
      );
    }
  });

  it("should throw a grouped error for an invalid pointer if continueOnError is true", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.rel("test/specs/invalid-pointers/invalid.json"), { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (e) {
      const err = e as JSONParserErrorGroup;
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      expect(err.files).to.equal(parser);
      expect(err.message).to.equal(
        `1 error occurred while reading '${path.abs("test/specs/invalid-pointers/invalid.json")}'`,
      );
      expect(err.errors).to.containSubset([
        {
          name: InvalidPointerError.name,
          message: 'Invalid $ref pointer "f". Pointers must begin with "#/"',
          path: ["foo"],
          source: path.unixify(path.abs("test/specs/invalid-pointers/invalid.json")),
        },
      ]);
    }
  });
});
