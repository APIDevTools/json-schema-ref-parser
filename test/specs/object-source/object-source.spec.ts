import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import internalRefsParsedSchema from "../internal/parsed.js";
import internalRefsDereferencedSchema from "../internal/dereferenced.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

// @ts-expect-error TS(2345): Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
const isWindows = /^win/.test(globalThis.process ? globalThis.process.platform : undefined);

describe("Object sources (instead of file paths)", () => {
  it("should dereference a single object", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(helper.cloneDeep(internalRefsParsedSchema));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(internalRefsDereferencedSchema);
    // The schema path should be the current directory
    const expectedPaths = [path.cwd()];
    if (!isWindows) {
      expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
      expect(parser.$refs.values()).to.have.keys(expectedPaths);
    }
    // Reference equality
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name).to.equal(schema.definitions.name);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.definitions.requiredString)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.definitions.name.properties.first)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.definitions.name.properties.last)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.name.properties.first)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.name.properties.last);
  });

  it("should dereference an object that references external files", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(helper.cloneDeep(parsedSchema.schema));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // The schema path should be the current directory, and all other paths should be absolute
    const expectedPaths = [
      path.cwd(),
      path.abs("test/specs/object-source/definitions/definitions.json"),
      path.abs("test/specs/object-source/definitions/name.yaml"),
      path.abs("test/specs/object-source/definitions/required-string.yaml"),
    ];
    if (!isWindows) {
      expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
      expect(parser.$refs.values()).to.have.keys(expectedPaths);
    }
    // Reference equality
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name).to.equal(schema.definitions.name);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.definitions.requiredString)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.definitions.name.properties.first)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.definitions.name.properties.last)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.name.properties.first)
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      .to.equal(schema.properties.name.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle an object that references external files", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(helper.cloneDeep(parsedSchema.schema));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
    // The schema path should be the current directory, and all other paths should be absolute
    const expectedPaths = [
      path.cwd(),
      path.abs("test/specs/object-source/definitions/definitions.json"),
      path.abs("test/specs/object-source/definitions/name.yaml"),
      path.abs("test/specs/object-source/definitions/required-string.yaml"),
    ];
    if (!isWindows) {
      expect(parser.$refs.paths()).to.have.same.members(expectedPaths);
      expect(parser.$refs.values()).to.have.keys(expectedPaths);
    }
  });
});
