import { host } from "@jsdevtools/host-environment";
import { expect } from "chai";
import { parse as _parse, dereference, bundle } from "../../..";
import { shouldNotGetCalled, testResolve, convertNodeBuffersToPOJOs } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { schema as _schema, yaml as _yaml, json as _json, text, binary as _binary, unknown } from "./parsed";
import dereferencedSchema from "./dereferenced";

describe("Blank files", () => {
  let windowOnError, testDone;

  beforeEach(() => {
    // Some old Webkit browsers throw an error when downloading zero-byte files.
    windowOnError = host.global.onerror;
    host.global.onerror = function () {
      testDone();
      return true;
    };
  });

  afterEach(() => {
    host.global.onerror = windowOnError;
  });

  describe("main file", () => {
    it("should throw an error for a blank YAML file", async () => {
      try {
        await _parse(rel("specs/blank/files/blank.yaml"));
        shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain("blank/files/blank.yaml");
        expect(err.message).to.contain("is not a valid JSON Schema");
      }
    });

    it('should throw a different error if "parse.yaml.allowEmpty" is disabled', async () => {
      try {
        await _parse(rel("specs/blank/files/blank.yaml"), { parse: { yaml: { allowEmpty: false }}});
        shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("blank/files/blank.yaml");
        expect(err.message).to.contain("Parsed value is empty");
      }
    });

    it("should throw an error for a blank JSON file", async () => {
      try {
        await _parse(rel("specs/blank/files/blank.json"), { parse: { json: { allowEmpty: false }}});
        shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("blank/files/blank.json");
      }
    });
  });

  describe("referenced files", () => {
    it("should parse successfully", async () => {
      let schema = await _parse(rel("specs/blank/blank.yaml"));
      expect(schema).to.deep.equal(_schema);
    });

    it("should resolve successfully", testResolve(
      rel("specs/blank/blank.yaml"),
      abs("specs/blank/blank.yaml"), _schema,
      abs("specs/blank/files/blank.yaml"), _yaml,
      abs("specs/blank/files/blank.json"), _json,
      abs("specs/blank/files/blank.txt"), text,
      abs("specs/blank/files/blank.png"), _binary,
      abs("specs/blank/files/blank.foo"), unknown
    ));

    it("should dereference successfully", async () => {
      let schema = await dereference(rel("specs/blank/blank.yaml"));
      schema.binary = convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it("should bundle successfully", async () => {
      let schema = await bundle(rel("specs/blank/blank.yaml"));
      schema.binary = convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it('should throw an error if "allowEmpty" is disabled', async () => {
      try {
        await dereference(rel("specs/blank/blank.yaml"), { parse: { binary: { allowEmpty: false }}});
        shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain("Error parsing ");
        expect(err.message).to.contain("blank/files/blank.png");
        expect(err.message).to.contain("Parsed value is empty");
      }
    });
  });
});
