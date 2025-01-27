import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";
import dereferencedSchema from "./dereferenced.js";

import { expect } from "vitest";

describe("Schema with literal $refs in examples", () => {
  it("should exclude the given paths from dereferencing", async () => {
    const parser = new $RefParser();

    const schema = await parser.dereference(path.rel("test/specs/ref-in-excluded-path/ref-in-excluded-path.yaml"), {
      dereference: {
        excludedPathMatcher: (schemaPath: any) => {
          return /\/example(\/|$|s\/[^/]+\/value(\/|$))/.test(schemaPath);
        },
      },
    });
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });
});
