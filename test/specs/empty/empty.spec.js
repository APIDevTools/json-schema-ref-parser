import { expect } from "chai";
import $RefParser, { parse as _parse } from "../../../lib";
import { testResolve, shouldNotGetCalled } from "../../utils/helper";
import { rel, abs } from "../../utils/path";

describe("Empty schema", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(schema).to.be.empty;  // eslint-disable-line no-unused-expressions
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/empty/empty.json")]);
  });

  it("should resolve successfully", testResolve(
    rel("specs/empty/empty.json"),
    abs("specs/empty/empty.json"), {}
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(schema).to.be.empty;  // eslint-disable-line no-unused-expressions
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/empty/empty.json")]);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/empty/empty.json"));
    expect(schema).to.be.an("object");
    expect(schema).to.be.empty;  // eslint-disable-line no-unused-expressions
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/empty/empty.json")]);
  });

  it('should throw an error if "parse.json.allowEmpty" is disabled', async () => {
    try {
      await _parse(rel("specs/empty/empty.json"), { parse: { json: { allowEmpty: false }}});
      shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      expect(err.message).to.contain("Error parsing ");
      expect(err.message).to.contain('empty/empty.json"');
      expect(err.message).to.contain("Parsed value is empty");
    }
  });
});
