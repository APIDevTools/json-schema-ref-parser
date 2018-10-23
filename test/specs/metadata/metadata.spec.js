describe('Dereference save metadata', function () {
  'use strict';

  it('should save metadata for internal refs', function () {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/metadata/spec.yaml'), { dereference: { saveOriginalRefs: true }})
      .then(function (schema) {
        var metadata = $RefParser.getMetadata(schema.properties.a);
        expect(metadata).to.be.an('object');
        expect(metadata.$ref).to.eq('#/definitions/internal');
        expect(metadata.pathFromRoot).to.eq('#/properties/a');
        expect(metadata.path).to.contain('spec.yaml#/properties/a');
      });
  });

  it('should save metadata for external refs', function () {
    var parser = new $RefParser();
    return parser
      .dereference(path.rel('specs/metadata/spec.yaml'), { dereference: { saveOriginalRefs: true }})
      .then(function (schema) {
        var metadata = $RefParser.getMetadata(schema.properties.b);
        expect(metadata).to.be.an('object');
        expect(metadata.$ref).to.eq('external.yaml');
        expect(metadata.pathFromRoot).to.eq('#/properties/b');
        expect(metadata.path).to.contain('spec.yaml#/properties/b');
      });
  });
});
