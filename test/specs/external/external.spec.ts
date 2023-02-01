import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

describe("Schema with external $refs", () => {
  it("should parse successfully from an absolute path", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.abs("test/specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/external/external.yaml")]);
  });

  it("should parse successfully from a relative path", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/external/external.yaml")]);
  });

  it("should parse successfully from a url", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.url("test/specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.url("test/specs/external/external.yaml")]);
  });

  it(
    "should resolve successfully from an absolute path",
    helper.testResolve(
      path.abs("test/specs/external/external.yaml"),
      path.abs("test/specs/external/external.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/external/definitions/definitions.json"),
      parsedSchema.definitions,
      path.abs("test/specs/external/definitions/name.yaml"),
      parsedSchema.name,
      path.abs("test/specs/external/definitions/required-string.yaml"),
      parsedSchema.requiredString,
    ),
  );

  it(
    "should resolve successfully from a relative path",
    helper.testResolve(
      path.rel("test/specs/external/external.yaml"),
      path.abs("test/specs/external/external.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/external/definitions/definitions.json"),
      parsedSchema.definitions,
      path.abs("test/specs/external/definitions/name.yaml"),
      parsedSchema.name,
      path.abs("test/specs/external/definitions/required-string.yaml"),
      parsedSchema.requiredString,
    ),
  );

  it(
    "should resolve successfully from a url",
    helper.testResolve(
      path.url("test/specs/external/external.yaml"),
      path.url("test/specs/external/external.yaml"),
      parsedSchema.schema,
      path.url("test/specs/external/definitions/definitions.json"),
      parsedSchema.definitions,
      path.url("test/specs/external/definitions/name.yaml"),
      parsedSchema.name,
      path.url("test/specs/external/definitions/required-string.yaml"),
      parsedSchema.requiredString,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name).to.equal(schema.definitions.name);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.definitions["required string"])
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

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/external/external.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
