import { expect } from "chai";
import $RefParser from "../../../lib/index.js";
import { rel } from "../../utils/path";
import dereferencedSchema from "./dereferenced";

describe("Schema with literal $refs in examples", () => {
  it("should exclude the given paths from dereferencing", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/ref-in-excluded-path/ref-in-excluded-path.yaml"), {
      dereference: {
        excludedPathMatcher: (schemaPath) => {
          return /\/example(\/|$|s\/[^\/]+\/value(\/|$))/.test(schemaPath);
        }
      }
    });
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });
});
