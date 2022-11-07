import $RefParser from "../../../lib";
import { testResolve } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { expect } from "chai";
import { schema as _schema, file } from "./parsed";
import dereferencedSchema from "./dereferenced";

describe("File names with special characters", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"),
    abs("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"), _schema,
    abs("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.json"), file
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });
});
