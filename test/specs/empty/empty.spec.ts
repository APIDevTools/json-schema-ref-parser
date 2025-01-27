import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";

import { expect } from "vitest";

describe("Empty schema", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/empty/empty.json")]);
  });

  it(
    "should resolve successfully",
    helper.testResolve(path.rel("test/specs/empty/empty.json"), path.abs("test/specs/empty/empty.json"), {}),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/empty/empty.json")]);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/empty/empty.json")]);
  });

  it('should throw an error if "parse.json.allowEmpty" is disabled', async () => {
    try {
      await $RefParser.parse(path.rel("test/specs/empty/empty.json"), { parse: { json: { allowEmpty: false } } });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Error parsing ");
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain('empty/empty.json"');
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Parsed value is empty");
    }
  });
});
