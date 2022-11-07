import chai, { use } from "chai";
import chaiSubset from "chai-subset";
use(chaiSubset);
const { expect } = chai;
import $RefParser, { dereference } from "../../../lib";
import { shouldNotGetCalled } from "../../utils/helper";
import { rel, abs, unixify } from "../../utils/path";
import { JSONParserErrorGroup, InvalidPointerError } from "../../../lib/util/errors";

describe("Schema with invalid pointers", () => {
  it("should throw an error for an invalid pointer", async () => {
    try {
      await dereference(rel("specs/invalid-pointers/invalid.json"));
      shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(InvalidPointerError);
      expect(err.message).to.contain("Invalid $ref pointer \"f\". Pointers must begin with \"#/\"");
    }
  });

  it("should throw a grouped error for an invalid pointer if continueOnError is true", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(rel("specs/invalid-pointers/invalid.json"), { continueOnError: true });
      shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      expect(err.files).to.equal(parser);
      expect(err.message).to.equal(`1 error occurred while reading '${abs("specs/invalid-pointers/invalid.json")}'`);
      expect(err.errors).to.containSubset([
        {
          name: InvalidPointerError.name,
          message: "Invalid $ref pointer \"f\". Pointers must begin with \"#/\"",
          path: ["foo"],
          source: unixify(abs("specs/invalid-pointers/invalid.json")),
        }
      ]);
    }
  });
});
