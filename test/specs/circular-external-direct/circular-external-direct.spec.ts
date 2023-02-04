import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";

describe("Schema with direct circular (recursive) external $refs", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(
      path.rel("test/specs/circular-external-direct/circular-external-direct-root.yaml"),
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.abs("test/specs/circular-external-direct/circular-external-direct-root.yaml"),
    ]);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(
      path.rel("test/specs/circular-external-direct/circular-external-direct-root.yaml"),
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
  });
});
