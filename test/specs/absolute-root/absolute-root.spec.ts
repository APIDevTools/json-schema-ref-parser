import { describe, it, beforeEach, afterEach } from "vitest";
import { resolve } from "path";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";
import helper from "../../utils/helper.js";
import * as urlModule from "../../../lib/util/url.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";
const url = { cwd: urlModule.cwd };

describe("When executed in the context of root directory", () => {
  // Store the OS root directory
  const root = resolve("/");

  // Store references to the original methods
  const originalProcessCwd = process.cwd;
  const originalUrlCwd = url.cwd;

  /**
   * A mock `process.cwd()` implementation that always returns the root diretory
   */
  function mockProcessCwd() {
    return root;
  }

  /**
   * Temporarily mocks `process.cwd()` while calling the real `url.cwd()` implemenation
   */
  function mockUrlCwd() {
    try {
      process.cwd = mockProcessCwd;
      // @ts-expect-error TS(2345): Argument of type 'IArguments' is not assignable to... Remove this comment to see the full error message
      return originalUrlCwd.apply(null, arguments);
    } finally {
      process.cwd = originalProcessCwd;
    }
  }

  beforeEach(() => {
    url.cwd = mockUrlCwd;
  });

  afterEach(() => {
    url.cwd = originalUrlCwd;
    process.cwd = originalProcessCwd; // already restored by the finally block above, but just in case
  });

  it("should parse successfully from an absolute path", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.abs("test/specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/absolute-root/absolute-root.yaml")]);
  });

  it("should parse successfully from a url", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.url("test/specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.url("test/specs/absolute-root/absolute-root.yaml")]);
  });

  it(
    "should resolve successfully from an absolute path",
    helper.testResolve(
      path.abs("test/specs/absolute-root/absolute-root.yaml"),
      path.abs("test/specs/absolute-root/absolute-root.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/absolute-root/definitions/definitions.json"),
      parsedSchema.definitions,
      path.abs("test/specs/absolute-root/definitions/name.yaml"),
      parsedSchema.name,
      path.abs("test/specs/absolute-root/definitions/required-string.yaml"),
      parsedSchema.requiredString,
    ),
  );

  it(
    "should resolve successfully from a url",
    helper.testResolve(
      path.url("test/specs/absolute-root/absolute-root.yaml"),
      path.url("test/specs/absolute-root/absolute-root.yaml"),
      parsedSchema.schema,
      path.url("test/specs/absolute-root/definitions/definitions.json"),
      parsedSchema.definitions,
      path.url("test/specs/absolute-root/definitions/name.yaml"),
      parsedSchema.name,
      path.url("test/specs/absolute-root/definitions/required-string.yaml"),
      parsedSchema.requiredString,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.abs("test/specs/absolute-root/absolute-root.yaml"));
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
    const schema = await parser.bundle(path.abs("test/specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
