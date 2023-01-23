import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

/**
 * This test is from PR #62
 * https://github.com/APIDevTools/json-schema-ref-parser/pull/62
 */
describe("Schema with two external refs to the same value and internal ref before", () => {
  it("should parse successfully from an absolute path", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.abs("test/specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.abs("test/specs/external-from-internal/external-from-internal.yaml"),
    ]);
  });

  it("should parse successfully from a relative path", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel("test/specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.abs("test/specs/external-from-internal/external-from-internal.yaml"),
    ]);
  });

  it("should parse successfully from a url", async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.url("test/specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.url("test/specs/external-from-internal/external-from-internal.yaml"),
    ]);
  });

  it(
    "should resolve successfully from an absolute path",
    helper.testResolve(
      path.abs("test/specs/external-from-internal/external-from-internal.yaml"),
      path.abs("test/specs/external-from-internal/external-from-internal.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/external-from-internal/definitions.yaml"),
      parsedSchema.definitions,
    ),
  );

  it(
    "should resolve successfully from a relative path",
    helper.testResolve(
      path.rel("test/specs/external-from-internal/external-from-internal.yaml"),
      path.abs("test/specs/external-from-internal/external-from-internal.yaml"),
      parsedSchema.schema,
      path.abs("test/specs/external-from-internal/definitions.yaml"),
      parsedSchema.definitions,
    ),
  );

  it(
    "should resolve successfully from a url",
    helper.testResolve(
      path.url("test/specs/external-from-internal/external-from-internal.yaml"),
      path.url("test/specs/external-from-internal/external-from-internal.yaml"),
      parsedSchema.schema,
      path.url("test/specs/external-from-internal/definitions.yaml"),
      parsedSchema.definitions,
    ),
  );

  it("should dereference successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    // @ts-expect-error TS(2339): Property 'internal1' does not exist on type 'JSONS... Remove this comment to see the full error message
    expect(schema.internal1).to.equal(schema.internal2);
    // @ts-expect-error TS(2339): Property 'internal2' does not exist on type 'JSONS... Remove this comment to see the full error message
    expect(schema.internal2).to.equal(schema.external1);
    // @ts-expect-error TS(2339): Property 'internal3' does not exist on type 'JSONS... Remove this comment to see the full error message
    expect(schema.internal3).to.equal(schema.internal4);
    // @ts-expect-error TS(2339): Property 'internal4' does not exist on type 'JSONS... Remove this comment to see the full error message
    expect(schema.internal4).to.equal(schema.external2);
    // @ts-expect-error TS(2339): Property 'internal1' does not exist on type 'JSONS... Remove this comment to see the full error message
    expect(schema.internal1.test)
      // @ts-expect-error TS(2339): Property 'internal2' does not exist on type 'JSONS... Remove this comment to see the full error message
      .to.equal(schema.internal2.test)
      // @ts-expect-error TS(2339): Property 'internal3' does not exist on type 'JSONS... Remove this comment to see the full error message
      .to.equal(schema.internal3.test)
      // @ts-expect-error TS(2339): Property 'internal4' does not exist on type 'JSONS... Remove this comment to see the full error message
      .to.equal(schema.internal4.test)
      // @ts-expect-error TS(2339): Property 'external1' does not exist on type 'JSONS... Remove this comment to see the full error message
      .to.equal(schema.external1.test)
      // @ts-expect-error TS(2339): Property 'external2' does not exist on type 'JSONS... Remove this comment to see the full error message
      .to.equal(schema.external2.test);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/external-from-internal/external-from-internal.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
