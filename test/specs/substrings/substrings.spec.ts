import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

describe("$refs that are substrings of each other", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/substrings/substrings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/substrings/substrings.yaml")]);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("test/specs/substrings/substrings.yaml"),
      path.abs("test/specs/substrings/substrings.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/substrings/definitions/definitions.json"),
      parsedSchema.definitions,
      path.abs("test/specs/substrings/definitions/strings.yaml"),
      parsedSchema.strings,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/substrings/substrings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    const properties = schema.properties!;
    const definitions = schema.definitions!;
    expect(properties.firstName).to.equal(definitions.name);
    expect(properties.middleName).to.equal(definitions["name-with-min-length"]);
    expect(properties.lastName).to.equal(definitions["name-with-min-length-max-length"]);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/substrings/substrings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
