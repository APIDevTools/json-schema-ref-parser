import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

describe("multiple circular $refs at the same depth in the schema", () => {
  it("should bundle successfully", async () => {
    const parser = new $RefParser();

    const schema = await parser.bundle(path.rel("test/specs/circular-multi/definitions/root.json"));
    expect(schema).to.deep.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
