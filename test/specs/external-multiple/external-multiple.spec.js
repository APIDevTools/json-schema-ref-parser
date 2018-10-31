describe("Schema with multiple external $refs to different parts of a file", function () {
  "use strict";

  it("should parse successfully", function () {
    var parser = new $RefParser();
    return parser
      .parse(path.abs("specs/external-multiple/external-multiple.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.externalMultiple.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/external-multiple/external-multiple.yaml")]);
      });
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/external-multiple/external-multiple.yaml"),
    path.abs("specs/external-multiple/external-multiple.yaml"), helper.parsed.externalMultiple.schema,
    path.abs("specs/external-multiple/definitions.yaml"), helper.parsed.externalMultiple.definitions
  ));

  it("should dereference successfully", function () {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel("specs/external-multiple/external-multiple.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.externalMultiple);

        // Reference equality
        expect(schema.properties.user.example).to.equal(schema.example.user);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it("should bundle successfully", function () {
    var parser = new $RefParser();
    return parser
      .bundle(path.rel("specs/external-multiple/external-multiple.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.externalMultiple);
      });
  });
});
