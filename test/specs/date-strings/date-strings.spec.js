import chai from "chai";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";

const { expect } = chai;

describe("Schema with date strings", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/date-strings/date-strings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/date-strings/date-strings.yaml")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/date-strings/date-strings.yaml"),
    path.abs("specs/date-strings/date-strings.yaml"), parsedSchema.schema,
  ));
});
