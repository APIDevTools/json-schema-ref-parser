import { host } from "@jsdevtools/host-environment";
import { expect } from "chai";
import $RefParser, { resolve } from "../../lib";
import { shouldNotGetCalled } from "../utils/helper";
import { abs, url } from "../utils/path";
import { schema, definitions, name, requiredString } from "./external/parsed";
import dereferencedSchema, { definitions as _definitions } from "./external/dereferenced";
import bundledSchema, { definitions as __definitions } from "./external/bundled";

describe("$Refs object", () => {
  describe("paths", () => {
    it("should only contain the main file when calling `parse()`", async () => {
      let parser = new $RefParser();
      await parser.parse(abs("specs/external/external.yaml"));
      let paths = parser.$refs.paths();
      expect(paths).to.have.same.members([
        abs("specs/external/external.yaml")
      ]);
    });

    it("should contain all files when calling `resolve()`", async () => {
      let parser = new $RefParser();
      const $refs = await parser.resolve(abs("specs/external/external.yaml"));
      expect($refs).to.equal(parser.$refs);
      let paths = $refs.paths();
      expect(paths).to.have.same.members([
        abs("specs/external/external.yaml"),
        abs("specs/external/definitions/definitions.json"),
        abs("specs/external/definitions/name.yaml"),
        abs("specs/external/definitions/required-string.yaml")
      ]);
    });

    it("should return only local files", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      let paths = $refs.paths("file");
      if (host.node) {
        expect(paths).to.have.same.members([
          abs("specs/external/external.yaml"),
          abs("specs/external/definitions/definitions.json"),
          abs("specs/external/definitions/name.yaml"),
          abs("specs/external/definitions/required-string.yaml")
        ]);
      }
      else {
        expect(paths).to.be.an("array").with.lengthOf(0);
      }
    });

    it("should return only URLs", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      let paths = $refs.paths(["http"]);
      if (host.browser) {
        expect(paths).to.have.same.members([
          url("specs/external/external.yaml"),
          url("specs/external/definitions/definitions.json"),
          url("specs/external/definitions/name.yaml"),
          url("specs/external/definitions/required-string.yaml")
        ]);
      }
      else {
        expect(paths).to.be.an("array").with.lengthOf(0);
      }
    });
  });

  describe("values", () => {
    it("should be the same as `toJSON()`", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      expect($refs.values).to.equal($refs.toJSON);
    });

    it("should return the paths and values of all resolved files", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      let expected = {};
      expected[abs("specs/external/external.yaml")] = schema;
      expected[abs("specs/external/definitions/definitions.json")] = definitions;
      expected[abs("specs/external/definitions/name.yaml")] = name;
      expected[abs("specs/external/definitions/required-string.yaml")] = requiredString;
      let values = $refs.values();
      expect(values).to.deep.equal(expected);
    });

    it("should return the paths and values of all dereferenced files", async () => {
      let parser = new $RefParser();
      await parser.dereference(abs("specs/external/external.yaml"));
      let expected = {};
      expected[abs("specs/external/external.yaml")] = dereferencedSchema;
      expected[abs("specs/external/definitions/definitions.json")] = _definitions;
      expected[abs("specs/external/definitions/name.yaml")] = _definitions.name;
      expected[abs("specs/external/definitions/required-string.yaml")] = _definitions["required string"];
      let values = parser.$refs.values();
      expect(values).to.deep.equal(expected);
    });

    it("should return the paths and values of all bundled files", async () => {
      let parser = new $RefParser();
      await parser.bundle(abs("specs/external/external.yaml"));
      let expected = {};
      expected[abs("specs/external/external.yaml")] = bundledSchema;
      expected[abs("specs/external/definitions/definitions.json")] = __definitions;
      expected[abs("specs/external/definitions/name.yaml")] = __definitions.name;
      expected[abs("specs/external/definitions/required-string.yaml")] = __definitions["required string"];
      let values = parser.$refs.values();
      expect(values).to.deep.equal(expected);
    });

    it("should return only local files and values", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      let values = $refs.values("file");
      if (host.node) {
        let expected = {};
        expected[abs("specs/external/external.yaml")] = schema;
        expected[abs("specs/external/definitions/definitions.json")] = definitions;
        expected[abs("specs/external/definitions/name.yaml")] = name;
        expected[abs("specs/external/definitions/required-string.yaml")] = requiredString;
        values = $refs.values();
        expect(values).to.deep.equal(expected);
      }
      else {
        expect(values).to.be.an("object").and.empty;  // eslint-disable-line no-unused-expressions
      }
    });

    it("should return only URLs and values", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      let values = $refs.values(["http"]);
      if (host.browser) {
        let expected = {};
        expected[url("specs/external/external.yaml")] = schema;
        expected[url("specs/external/definitions/definitions.json")] = definitions;
        expected[url("specs/external/definitions/name.yaml")] = name;
        expected[url("specs/external/definitions/required-string.yaml")] = requiredString;
        values = $refs.values();
        expect(values).to.deep.equal(expected);
      }
      else {
        expect(values).to.be.an("object").and.empty;  // eslint-disable-line no-unused-expressions
      }
    });
  });

  describe("exists", () => {
    it("should work with absolute paths", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      expect($refs.exists(abs("specs/external/external.yaml"))).to.equal(true);
      expect($refs.exists(abs("specs/external/definitions/definitions.json"))).to.equal(true);
      expect($refs.exists(abs("specs/external/definitions/name.yaml"))).to.equal(true);
      expect($refs.exists(abs("specs/external/definitions/required-string.yaml"))).to.equal(true);
    });

    it("should work with relative paths", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      expect($refs.exists("external.yaml")).to.equal(true);
      expect($refs.exists("definitions/definitions.json")).to.equal(true);
      expect($refs.exists("definitions/name.yaml")).to.equal(true);
      expect($refs.exists("definitions/required-string.yaml")).to.equal(true);
    });

    it("should return false if the $ref does not exist", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      expect($refs.exists("foo bar")).to.equal(false);
    });
  });

  describe("get", () => {
    it("should work with absolute paths", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      expect($refs.get(abs("specs/external/external.yaml"))).to.deep.equal(schema);
      expect($refs.get(abs("specs/external/definitions/definitions.json"))).to.deep.equal(definitions);
      expect($refs.get(abs("specs/external/definitions/name.yaml"))).to.deep.equal(name);
      expect($refs.get(abs("specs/external/definitions/required-string.yaml"))).to.deep.equal(requiredString);
    });

    it("should work with relative paths", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      expect($refs.get("external.yaml")).to.deep.equal(schema);
      expect($refs.get("definitions/definitions.json")).to.deep.equal(definitions);
      expect($refs.get("definitions/name.yaml")).to.deep.equal(name);
      expect($refs.get("definitions/required-string.yaml")).to.deep.equal(requiredString);
    });

    it("should get the entire file if there is no hash", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      let value = $refs.get("definitions/name.yaml");
      expect(value).to.deep.equal(name);
    });

    it("should get the entire file if the hash is empty", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      let value = $refs.get("definitions/name.yaml#");
      expect(value).to.deep.equal(name);
    });

    it('should try to get an empty key if the hash is "#/"', async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));

      try {
        $refs.get("definitions/name.yaml#/");
        shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Token "" does not exist.');
      }
    });

    it("should resolve values across multiple files if necessary", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      expect($refs.get("external.yaml#/properties/name/properties/first")).to.deep.equal({
        title: "required string",
        type: "string",
        minLength: 1
      });
      expect($refs.get("external.yaml#/properties/name/properties/first/title")).to.equal("required string");
    });

    it("should throw an error if the file does not exist", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));

      try {
        $refs.get("foo-bar.yaml#/some/value");
        shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain('Error resolving $ref pointer "foo-bar.yaml#/some/value".');
        expect(err.message).to.contain('foo-bar.yaml" not found.');
      }
    });

    it("should throw an error if the JSON Pointer path does not exist", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));

      try {
        $refs.get("external.yaml#/foo/bar");
        shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Token "foo" does not exist.');
      }
    });
  });

  describe("set", () => {
    it("should work with absolute paths", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      let $ref = abs("specs/external/external.yaml") + "#/properties/name";
      $refs.set($ref, { foo: "bar" });
      expect($refs.get("external.yaml#/properties/name")).to.deep.equal({ foo: "bar" });
    });

    it("should work with relative paths", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      $refs.set("external.yaml#/properties/name", { foo: "bar" });
      expect($refs.get("external.yaml#/properties/name")).to.deep.equal({ foo: "bar" });
    });

    it("should resolve values across multiple files if necessary", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      $refs.set("external.yaml#/properties/name/properties/first/title", "foo bar");
      expect($refs.get("external.yaml#/properties/name/properties/first/title")).to.equal("foo bar");
    });

    it("should throw an error if the file does not exist", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));

      try {
        $refs.set("foo-bar.yaml#/some/path", "some value");
        shouldNotGetCalled();
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain('Error resolving $ref pointer "foo-bar.yaml#/some/path".');
        expect(err.message).to.contain('foo-bar.yaml" not found.');
      }
    });

    it("should NOT throw an error if the JSON Pointer path does not exist (it creates the new value instead)", async () => {
      const $refs = await resolve(abs("specs/external/external.yaml"));
      $refs.set("external.yaml#/foo/bar/baz", { hello: "world" });
      expect($refs.get("external.yaml#/foo/bar/baz")).to.deep.equal({ hello: "world" });
    });
  });

});
