"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const dereferencedSchema = require("./dereferenced");

describe("Schema with literal $refs in examples", () => {
  it("should exclude the given paths from dereferencing", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/ref-in-excluded-path/ref-in-excluded-path.yaml"), {
      dereference: {
        excludedPathMatcher: (schemaPath) => {
          return /\/example(\/|$|s\/[^\/]+\/value(\/|$))/.test(schemaPath);
        }
      }
    });
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });
});
