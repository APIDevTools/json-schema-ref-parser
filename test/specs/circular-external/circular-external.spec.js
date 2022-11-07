import { expect } from "chai";
import $RefParser from "../../..";
import { testResolve, shouldNotGetCalled } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { schema as _schema, pet, child, parent, person } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("Schema with circular (recursive) external $refs", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(rel("specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular-external/circular-external.yaml")]);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should resolve successfully", testResolve(
    rel("specs/circular-external/circular-external.yaml"),
    abs("specs/circular-external/circular-external.yaml"), _schema,
    abs("specs/circular-external/definitions/pet.yaml"), pet,
    abs("specs/circular-external/definitions/child.yaml"), child,
    abs("specs/circular-external/definitions/parent.yaml"), parent,
    abs("specs/circular-external/definitions/person.yaml"), person
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(rel("specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
    // Reference equality
    expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
    expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
    expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
  });

  it('should throw an error if "options.$refs.circular" is false', async () => {
    let parser = new $RefParser();

    try {
      await parser.dereference(rel("specs/circular-external/circular-external.yaml"), { dereference: { circular: false }});
      shouldNotGetCalled();
    }
    catch (err) {
      // A ReferenceError should have been thrown
      expect(err).to.be.an.instanceOf(ReferenceError);
      expect(err.message).to.contain("Circular $ref pointer found at ");
      expect(err.message).to.contain("specs/circular-external/circular-external.yaml#/definitions/thing");

      // $Refs.circular should be true
      expect(parser.$refs.circular).to.equal(true);
    }
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(rel("specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });
});
