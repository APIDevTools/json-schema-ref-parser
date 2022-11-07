import { expect } from "chai";
import $RefParser from "../../../lib/index.js";
import { rel } from "../../utils/path";
import bundledSchema from "./bundled";

describe("multiple circular $refs at the same depth in the schema", () => {
  it("should bundle successfully", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(rel("specs/circular-multi/definitions/root.json"));
    expect(schema).to.deep.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
