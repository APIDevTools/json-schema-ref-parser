describe("Schema with $refs to parts of external files", function () {
  "use strict";

  it("should parse successfully", function () {
    let parser = new $RefParser();
    return parser
      .parse(path.rel("specs/external-partial/external-partial.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.externalPartial.schema);
        expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/external-partial/external-partial.yaml")]);
      });
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/external-partial/external-partial.yaml"),
    path.abs("specs/external-partial/external-partial.yaml"), helper.parsed.externalPartial.schema,
    path.abs("specs/external-partial/definitions/definitions.json"), helper.parsed.externalPartial.definitions,
    path.abs("specs/external-partial/definitions/name.yaml"), helper.parsed.externalPartial.name,
    path.abs("specs/external-partial/definitions/required-string.yaml"), helper.parsed.externalPartial.requiredString
  ));

  it("should dereference successfully", function () {
    let parser = new $RefParser();
    return parser
      .dereference(path.rel("specs/external-partial/external-partial.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.externalPartial);

        // Reference equality
        expect(schema.properties.name.properties.first)
          .to.equal(schema.properties.name.properties.last);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it("should bundle successfully", function () {
    let parser = new $RefParser();
    return parser
      .bundle(path.rel("specs/external-partial/external-partial.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.externalPartial);
      });
  });
});

