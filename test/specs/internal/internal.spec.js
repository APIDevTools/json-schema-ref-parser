describe("Schema with internal $refs", function () {
  "use strict";

  it("should parse successfully", function () {
    let parser = new $RefParser();
    return parser
      .parse(path.rel("specs/internal/internal.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.parsed.internal);
        expect(parser.$refs.paths()).to.deep.equal([path.abs("specs/internal/internal.yaml")]);
      });
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/internal/internal.yaml"),
    path.abs("specs/internal/internal.yaml"), helper.parsed.internal
  ));

  it("should dereference successfully", function () {
    let parser = new $RefParser();
    return parser
      .dereference(path.rel("specs/internal/internal.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.dereferenced.internal);

        // Reference equality
        expect(schema.properties.name).to.equal(schema.definitions.name);
        expect(schema.definitions.requiredString)
          .to.equal(schema.definitions.name.properties.first)
          .to.equal(schema.definitions.name.properties.last)
          .to.equal(schema.properties.name.properties.first)
          .to.equal(schema.properties.name.properties.last);

        // The "circular" flag should NOT be set
        expect(parser.$refs.circular).to.equal(false);
      });
  });

  it("should bundle successfully", function () {
    let parser = new $RefParser();
    return parser
      .bundle(path.rel("specs/internal/internal.yaml"))
      .then(function (schema) {
        expect(schema).to.equal(parser.schema);
        expect(schema).to.deep.equal(helper.bundled.internal);
      });
  });
});
