import { describe, it } from "vitest";

import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import { InvalidPointerError, ResolverError, MissingPointerError } from "../../../lib/util/errors.js";

describe("Report correct error source and path for", () => {
  it("schema with broken reference", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference({ foo: { bar: { $ref: "I do not exist" } } }, { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err: any) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          source: (source: any) => typeof source === "string",
          path: ["foo", "bar"],
          message: (message: any) => typeof message === "string",
        },
      ]);
    }
  });

  it("schema with a local reference pointing at property with broken external reference", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs("test/specs/error-source/broken-external.json"), { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err: any) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          source: path.unixify(path.abs("test/specs/error-source/broken-external.json")),
          path: ["components", "schemas", "testSchema", "properties", "test"],
          message: (message: any) => typeof message === "string",
        },
      ]);
    }
  });

  it("schema with a missing local pointer and reference pointing at external file with broken external", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs("test/specs/error-source/invalid-external.json"), { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err: any) {
      expect(err.errors).to.containSubset([
        {
          name: MissingPointerError.name,
          source: path.unixify(path.abs("test/specs/error-source/invalid-external.json")),
          path: ["foo", "bar"],
          message: (message: any) => typeof message === "string",
        },
        {
          name: ResolverError.name,
          source: path.unixify(path.abs("test/specs/error-source/broken-external.json")),
          path: ["components", "schemas", "testSchema", "properties", "test"],
          message: (message: any) => typeof message === "string",
        },
      ]);
    }
  });

  it("schema with an invalid pointer", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs("test/specs/error-source/invalid-pointer.json"), { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err: any) {
      expect(err.errors).to.containSubset([
        {
          name: InvalidPointerError.name,
          source: path.unixify(path.abs("test/specs/error-source/invalid-pointer.json")),
          path: ["foo", "baz"],
          message: (message: any) => typeof message === "string",
        },
      ]);
    }
  });
});
