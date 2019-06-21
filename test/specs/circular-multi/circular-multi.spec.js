"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const bundledSchema = require("./bundled");

describe("multiple circular $refs at the same depth in the schema", () => {
  it("should bundle successfully", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(path.rel("specs/circular-multi/definitions/root.json"));
    expect(schema).to.deep.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
