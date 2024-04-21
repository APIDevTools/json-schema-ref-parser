import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path";
import dereferencedSchema from "./bundled";
import Ajv from "ajv";
import addFormats from "ajv-formats";

describe("Bundles", () => {
  it("should bundle correctly", async () => {
    const parser = new $RefParser();
    const schema = path.rel("test/specs/bundle/schemaA.json");
    const bundled = await parser.bundle(schema);
    const derefed = await parser.dereference(bundled);
    const ajv = new Ajv();
    addFormats(ajv);

    const compiled = ajv.compile(derefed);
    const compiledDerefed = ajv.compile(bundled);
    expect(bundled).to.deep.equal(dereferencedSchema);
  });
});
