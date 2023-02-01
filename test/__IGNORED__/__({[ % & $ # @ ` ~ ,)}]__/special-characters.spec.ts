import $RefParser from "../../../lib";
import helper from "../../utils/helper";
import path from "../../utils/path";
import { describe, it } from "vitest";
import parsedSchema from "./parsed";
import dereferencedSchema from "./dereferenced";

import { expect } from "vitest";

describe("File names with special characters", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(
      path.rel("test/specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"),
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.abs("test/specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"),
    ]);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("test/specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"),
      path.abs("test/specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.json"),
      parsedSchema.file,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(
      path.rel("test/specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"),
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(
      path.rel("test/specs/__({[ % & $ # @ ` ~ ,)}]__/__({[ % & $ # @ ` ~ ,)}]__.yaml"),
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });
});
