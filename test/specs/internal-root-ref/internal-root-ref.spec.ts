import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

describe("Schema with $ref at root level", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/internal-root-ref/internal-root-ref.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/internal-root-ref/internal-root-ref.yaml")]);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("test/specs/internal-root-ref/internal-root-ref.yaml"),
      path.abs("test/specs/internal-root-ref/internal-root-ref.yaml"),
      parsedSchema,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/internal-root-ref/internal-root-ref.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.userId).to.deep.equal(schema.definitions.user.properties.userId);
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/internal-root-ref/internal-root-ref.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
