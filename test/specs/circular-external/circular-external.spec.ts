import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

describe("Schema with circular (recursive) external $refs", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/circular-external/circular-external.yaml")]);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("test/specs/circular-external/circular-external.yaml"),
      path.abs("test/specs/circular-external/circular-external.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/circular-external/definitions/pet.yaml"),
      parsedSchema.pet,
      path.abs("test/specs/circular-external/definitions/child.yaml"),
      parsedSchema.child,
      path.abs("test/specs/circular-external/definitions/parent.yaml"),
      parsedSchema.parent,
      path.abs("test/specs/circular-external/definitions/person.yaml"),
      parsedSchema.person,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
    // Reference equality
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
  });

  it('should throw an error if "options.dereference.circular" is false', async () => {
    const parser = new $RefParser();

    try {
      await parser.dereference(path.rel("test/specs/circular-external/circular-external.yaml"), {
        dereference: { circular: false },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      // A ReferenceError should have been thrown
      expect(err).to.be.an.instanceOf(ReferenceError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Circular $ref pointer found at ");
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("specs/circular-external/circular-external.yaml#/definitions/thing");

      // $Refs.circular should be true
      expect(parser.$refs.circular).to.equal(true);
    }
  });

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/circular-external/circular-external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });
});
