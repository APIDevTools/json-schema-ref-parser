import chai from "chai";
import $RefParser from "../../../lib/index.js";
import pathUtils from "../../utils/path.js";

const { expect } = chai;

describe("Schema with a $ref", () => {
  it("should call onDereference", async () => {
    let parser = new $RefParser();
    const calls = [];
    await parser.dereference(
      pathUtils.rel("specs/dereference-callback/dereference-callback.yaml"),
      {
        dereference: {
          onDereference (path, object) {
            calls.push({ path, object });
          },
        },
      }
    );
    expect(calls).to.deep.equal([
      { path: "#/definitions/b", object: { $ref: "#/definitions/a" }},
      { path: "#/definitions/a", object: { $ref: "#/definitions/a" }},
    ]);
  });
});
