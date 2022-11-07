import chai, { use } from "chai";
import chaiSubset from "chai-subset";
use(chaiSubset);
const { expect } = chai;
import $RefParser from "../../../lib";
import { rel, abs } from "../../utils/path";
import { schema as _schema } from "./parsed";
import dereferencedSchema from "./dereferenced";

describe("Schema with direct circular (recursive) external $refs", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/circular-external-direct/circular-external-direct-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular-external-direct/circular-external-direct-root.yaml")]);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/circular-external-direct/circular-external-direct-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
  });
});
