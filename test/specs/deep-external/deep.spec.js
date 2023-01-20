import chai from "chai";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";
import bundledSchema from "./bundled.js";

const { expect } = chai;

describe("Schema with deeply-nested external $refs", () => {
  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/deep-external/definitions/Main-spec.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
