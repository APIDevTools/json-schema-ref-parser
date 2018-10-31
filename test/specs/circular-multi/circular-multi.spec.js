describe("multiple circular $refs at the same depth in the schema", function () {
  "use strict";

  it("should bundle successfully", function () {
    var parser = new $RefParser();

    return parser
      .bundle(path.rel("specs/circular-multi/definitions/root.json"))
      .then(function (schema) {
        expect(schema).to.deep.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.circularMulti);
      });
  });
});
