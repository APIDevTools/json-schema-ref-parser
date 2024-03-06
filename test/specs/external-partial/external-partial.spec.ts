import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

describe("Schema with $refs to parts of external files", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/external-partial/external-partial.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/external-partial/external-partial.yaml")]);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("test/specs/external-partial/external-partial.yaml"),
      path.abs("test/specs/external-partial/external-partial.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/external-partial/definitions/definitions.json"),
      parsedSchema.definitions,
      path.abs("test/specs/external-partial/definitions/name.yaml"),
      parsedSchema.name,
      path.abs("test/specs/external-partial/definitions/required-string.yaml"),
      parsedSchema.requiredString,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/external-partial/external-partial.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name.properties.first).to.equal(schema.properties.name.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/external-partial/external-partial.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
