import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path";
import dereferencedSchema from "./bundled";

describe("Bundling schema with nullish values", () => {
  it("should bundle correctly", async () => {
    const parser = new $RefParser();
    const schema = path.rel("test/specs/bundle-null-value/bundle-null-value-example.yaml");
    const bundled = await parser.bundle(schema);
    expect(bundled).to.deep.equal(dereferencedSchema);
  });
});
