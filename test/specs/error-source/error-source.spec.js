import chai, { use } from "chai";
import chaiSubset from "chai-subset";
use(chaiSubset);

const { expect } = chai;
import $RefParser from "../../../lib/index";
import { shouldNotGetCalled } from "../../utils/helper";
import { abs, unixify } from "../../utils/path";
import { InvalidPointerError, ResolverError, MissingPointerError } from "../../../lib/util/errors";


describe("Report correct error source and path for", () => {
  it("schema with broken reference", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference({ foo: { bar: { $ref: "I do not exist" }}}, { continueOnError: true });
      shouldNotGetCalled();
    }
    catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          source: source => typeof source === "string",
          path: ["foo", "bar"],
          message: message => typeof message === "string",
        },
      ]);
    }
  });

  it("schema with a local reference pointing at property with broken external reference", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(abs("specs/error-source/broken-external.json"), { continueOnError: true });
      shouldNotGetCalled();
    }
    catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          source: unixify(abs("specs/error-source/broken-external.json")),
          path: ["components", "schemas", "testSchema", "properties", "test"],
          message: message => typeof message === "string",
        },
      ]);
    }
  });

  it("schema with a missing local pointer and reference pointing at external file with broken external", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(abs("specs/error-source/invalid-external.json"), { continueOnError: true });
      shouldNotGetCalled();
    }
    catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: MissingPointerError.name,
          source: unixify(abs("specs/error-source/invalid-external.json")),
          path: ["foo", "bar"],
          message: message => typeof message === "string",
        },
        {
          name: ResolverError.name,
          source: unixify(abs("specs/error-source/broken-external.json")),
          path: ["components", "schemas", "testSchema", "properties", "test"],
          message: message => typeof message === "string",
        },
      ]);
    }
  });

  it("schema with an invalid pointer", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(abs("specs/error-source/invalid-pointer.json"), { continueOnError: true });
      shouldNotGetCalled();
    }
    catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: InvalidPointerError.name,
          source: unixify(abs("specs/error-source/invalid-pointer.json")),
          path: ["foo", "baz"],
          message: message => typeof message === "string",
        },
      ]);
    }
  });
});
