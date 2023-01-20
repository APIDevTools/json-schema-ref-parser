import chai from "chai";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";
import bundledSchema from "./bundled.js";

const { expect } = chai;

describe("multiple circular $refs at the same depth in the schema", () => {
  it("should bundle successfully", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(path.rel("specs/circular-multi/definitions/root.json"));
    expect(schema).to.deep.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
