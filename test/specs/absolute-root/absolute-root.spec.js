import { expect } from "chai";
import { resolve } from "path";
import $RefParser from "../../..";
import { abs, url as _url } from "../../utils/path";
import { testResolve } from "../../utils/helper";
import { cwd } from "../../../lib/util/url";
import { schema as _schema, definitions, name, requiredString } from "./parsed";
import dereferencedSchema from "./dereferenced";
import bundledSchema from "./bundled";

describe("When executed in the context of root directory", () => {
  // Store the OS root directory
  const root = resolve("/");

  // Store references to the original methods
  const originalProcessCwd = process.cwd;
  const originalUrlCwd = cwd;

  /**
   * A mock `process.cwd()` implementation that always returns the root diretory
   */
  function mockProcessCwd () {
    return root;
  }

  /**
   * Temporarily mocks `process.cwd()` while calling the real `url.cwd()` implemenation
   */
  function mockUrlCwd () {
    try {
      process.cwd = mockProcessCwd;
      return originalUrlCwd.apply(null, arguments);
    }
    finally {
      process.cwd = originalProcessCwd;
    }
  }

  beforeEach("Mock process.cwd and url.cwd", () => {
    cwd = mockUrlCwd;
  });

  afterEach("Restore process.cwd and url.cwd", () => {
    cwd = originalUrlCwd;
    process.cwd = originalProcessCwd; // already restored by the finally block above, but just in case
  });


  it("should parse successfully from an absolute path", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(abs("specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([
      abs("specs/absolute-root/absolute-root.yaml")
    ]);
  });

  it("should parse successfully from a url", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(_url("specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(_schema);
    expect(parser.$refs.paths()).to.deep.equal([_url("specs/absolute-root/absolute-root.yaml")]);
  });

  it("should resolve successfully from an absolute path", testResolve(
    abs("specs/absolute-root/absolute-root.yaml"),
    abs("specs/absolute-root/absolute-root.yaml"), _schema,
    abs("specs/absolute-root/definitions/definitions.json"), definitions,
    abs("specs/absolute-root/definitions/name.yaml"), name,
    abs("specs/absolute-root/definitions/required-string.yaml"), requiredString
  ));

  it("should resolve successfully from a url", testResolve(
    _url("specs/absolute-root/absolute-root.yaml"),
    _url("specs/absolute-root/absolute-root.yaml"), _schema,
    _url("specs/absolute-root/definitions/definitions.json"), definitions,
    _url("specs/absolute-root/definitions/name.yaml"), name,
    _url("specs/absolute-root/definitions/required-string.yaml"), requiredString
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(abs("specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.name).to.equal(schema.definitions.name);
    expect(schema.definitions["required string"])
      .to.equal(schema.definitions.name.properties.first)
      .to.equal(schema.definitions.name.properties.last)
      .to.equal(schema.properties.name.properties.first)
      .to.equal(schema.properties.name.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(abs("specs/absolute-root/absolute-root.yaml"));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
