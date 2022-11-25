import { expect } from "chai";
import $RefParser from "../../../lib/index";
import { testResolve } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import parsedSchema from "./parsed";

describe("Schema without any $refs", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/no-refs/no-refs.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/no-refs/no-refs.yaml")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/no-refs/no-refs.yaml"),
    abs("specs/no-refs/no-refs.yaml"), parsedSchema
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/no-refs/no-refs.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/no-refs/no-refs.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
  });
});
