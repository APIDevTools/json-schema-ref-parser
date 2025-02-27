import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path";
import dereferenced from "./dereferenced.js";

describe("dereferencing a `$ref` that points to a `null` value", () => {
  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/dereference-null-ref/dereference-null-ref.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferenced);
  });
});
