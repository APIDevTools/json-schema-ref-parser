import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";

import { expect } from "vitest";

describe("Schema with date strings", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/date-strings/date-strings.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/date-strings/date-strings.yaml")]);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("test/specs/date-strings/date-strings.yaml"),
      path.abs("test/specs/date-strings/date-strings.yaml"),
      parsedSchema.schema,
    ),
  );
});
