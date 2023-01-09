import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import chai from "chai";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";

const { expect } = chai;

describe("File names with special characters", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(path.rel("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml")]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"),
    path.abs("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"), parsedSchema.schema,
    path.abs("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.json"), parsedSchema.file
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(path.rel("specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });
});
