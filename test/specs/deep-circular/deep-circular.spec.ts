import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

describe("Schema with deeply-nested circular $refs", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/deep-circular/deep-circular.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/deep-circular/deep-circular.yaml")]);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });

  it(
    "should resolve successfully",
    helper.testResolve(
      path.rel("test/specs/deep-circular/deep-circular.yaml"),
      path.abs("test/specs/deep-circular/deep-circular.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/deep-circular/definitions/name.yaml"),
      parsedSchema.name,
      path.abs("test/specs/deep-circular/definitions/required-string.yaml"),
      parsedSchema.requiredString,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/deep-circular/deep-circular.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
    // Reference equality
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.definitions.name)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.name)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.level1.properties.name)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.level1.properties.level2.properties.name)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.level1.properties.level2.properties.level3.properties.name)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.level1.properties.level2.properties.level3.properties.level4.properties.name);
  });

  it('should throw an error if "options.dereference.circular" is false', async () => {
    const parser = new $RefParser();

    try {
      await parser.dereference(path.rel("test/specs/deep-circular/deep-circular.yaml"), {
        dereference: { circular: false },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      // A ReferenceError should have been thrown
      expect(err).to.be.an.instanceOf(ReferenceError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Circular $ref pointer found at ");
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain(
        "specs/deep-circular/deep-circular.yaml#/properties/level1/properties/level2/properties/" +
          "level3/properties/level4/properties/level5/properties/level6/properties/level7/properties/" +
          "level8/properties/level9/properties/level10/properties/level11/properties/level12/properties/" +
          "level13/properties/level14/properties/level15/properties/level16/properties/level17/properties/" +
          "level18/properties/level19/properties/level20/properties/level21/properties/level22/properties/" +
          "level23/properties/level24/properties/level25/properties/level26/properties/level27/properties/" +
          "level28/properties/level29/properties/level30",
      );

      // $Refs.circular should be true
      expect(parser.$refs.circular).to.equal(true);
    }
  });

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/deep-circular/deep-circular.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
  });
});
