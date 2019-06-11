"use strict";

const { host } = require("host-environment");
const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");

describe("Blank files", () => {
  let windowOnError, testDone;

  beforeEach(function () {
    // Some old Webkit browsers throw an error when downloading zero-byte files.
    windowOnError = host.global.onerror;
    host.global.onerror = function () {
      testDone();
      return true;
    };
  });

  afterEach(function () {
    host.global.onerror = windowOnError;
  });

  describe("main file", () => {
    it("should throw an error for a blank YAML file", function (done) {
      testDone = done;
      $RefParser
        .parse(path.rel("specs/blank/files/blank.yaml"))
        .then(helper.shouldNotGetCalled(done))
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain("blank/files/blank.yaml");
          expect(err.message).to.contain("is not a valid JSON Schema");
          done();
        })
        .catch(done);
    });

    it('should throw a different error if "parse.yaml.allowEmpty" is disabled', function (done) {
      testDone = done;
      $RefParser
        .parse(path.rel("specs/blank/files/blank.yaml"), { parse: { yaml: { allowEmpty: false }}})
        .then(helper.shouldNotGetCalled(done))
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain("Error parsing ");
          expect(err.message).to.contain("blank/files/blank.yaml");
          expect(err.message).to.contain("Parsed value is empty");
          done();
        })
        .catch(done);
    });

    it("should throw an error for a blank JSON file", function (done) {
      testDone = done;
      $RefParser
        .parse(path.rel("specs/blank/files/blank.json"), { parse: { json: { allowEmpty: false }}})
        .then(helper.shouldNotGetCalled(done))
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain("Error parsing ");
          expect(err.message).to.contain("blank/files/blank.json");
          done();
        })
        .catch(done);
    });
  });

  describe("referenced files", () => {
    it("should parse successfully", function (done) {
      testDone = done;
      $RefParser
        .parse(path.rel("specs/blank/blank.yaml"))
        .then(function (schema) {
          expect(schema).to.deep.equal(parsedSchema.schema);
          done();
        })
        .catch(done);
    });

    it("should resolve successfully", helper.testResolve(
      path.rel("specs/blank/blank.yaml"),
      path.abs("specs/blank/blank.yaml"), parsedSchema.schema,
      path.abs("specs/blank/files/blank.yaml"), parsedSchema.yaml,
      path.abs("specs/blank/files/blank.json"), parsedSchema.json,
      path.abs("specs/blank/files/blank.txt"), parsedSchema.text,
      path.abs("specs/blank/files/blank.png"), parsedSchema.binary,
      path.abs("specs/blank/files/blank.foo"), parsedSchema.unknown
    ));

    it("should dereference successfully", function (done) {
      testDone = done;
      $RefParser
        .dereference(path.rel("specs/blank/blank.yaml"))
        .then(function (schema) {
          schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
          expect(schema).to.deep.equal(dereferencedSchema);
          done();
        })
        .catch(done);
    });

    it("should bundle successfully", function (done) {
      testDone = done;
      $RefParser
        .bundle(path.rel("specs/blank/blank.yaml"))
        .then(function (schema) {
          schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
          expect(schema).to.deep.equal(dereferencedSchema);
          done();
        })
        .catch(done);
    });

    it('should throw an error if "allowEmpty" is disabled', function (done) {
      testDone = done;
      $RefParser
        .dereference(path.rel("specs/blank/blank.yaml"), {
          parse: { binary: { allowEmpty: false }}
        })
        .then(helper.shouldNotGetCalled(done))
        .catch(function (err) {
          expect(err).to.be.an.instanceOf(SyntaxError);
          expect(err.message).to.contain("Error parsing ");
          expect(err.message).to.contain("blank/files/blank.png");
          expect(err.message).to.contain("Parsed value is empty");
          done();
        })
        .catch(done);
    });
  });
});
