import { expect } from "chai";
import $RefParser from "../../../lib/index";
import { testResolve } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { schema as _schema } from "./parsed";

describe("Schema with date strings", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/date-strings/date-strings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/date-strings/date-strings.yaml")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/date-strings/date-strings.yaml"),
    abs("specs/date-strings/date-strings.yaml"), _schema,
  ));
});
