"use strict";

const $RefParser = require("../../lib");
const { host } = require("@jsdevtools/host-environment");
const { expect } = require("chai");

const helper = module.exports = {
  /**
   * Throws an error if called.
   */
  shouldNotGetCalled () {
    throw new Error("This function should not have gotten called.");
  },

  /**
   * Tests the {@link $RefParser.resolve} method,
   * and asserts that the given file paths resolve to the given values.
   *
   * @param {string} filePath - The file path that should be resolved
   * @param {...*} [params] - The expected resolved file paths and values
   * @returns {Function}
   */
  testResolve (filePath, params) {
    let parsedSchema = arguments[2];
    let expectedFiles = [], messages = [], actualFiles;

    for (let i = 1; i < arguments.length; i += 2) {
      expectedFiles.push(arguments[i]);
      messages.push(arguments[i + 1]);
    }

    return async () => {
      let parser = new $RefParser();
      let $refs = await parser.resolve(filePath);

      expect(parser.schema).to.deep.equal(parsedSchema);
      expect(parser.$refs).to.equal($refs);

      // Resolved file paths
      try {
        expect((actualFiles = $refs.paths())).to.have.same.members(expectedFiles);
        if (host.node) {
          expect((actualFiles = $refs.paths(["file"]))).to.have.same.members(expectedFiles);
          expect($refs.paths("http")).to.be.an("array").with.lengthOf(0);
        }
        else {
          expect((actualFiles = $refs.paths(["http"]))).to.have.same.members(expectedFiles);
          expect($refs.paths("file")).to.be.an("array").with.lengthOf(0);
        }
      }
      catch (e) {
        console.log("Expected Files:", JSON.stringify(expectedFiles, null, 2));
        console.log("Actual Files:", JSON.stringify(actualFiles, null, 2));
        throw e;
      }

      // Resolved values
      let values = $refs.values();
      expect(values).to.have.keys(expectedFiles);
      for (let [i, file] of expectedFiles.entries()) {
        let actual = helper.convertNodeBuffersToPOJOs(values[file]);
        let expected = messages[i];
        expect(actual).to.deep.equal(expected, file);
      }
    };
  },

  /**
   * Converts Buffer objects to POJOs, so they can be compared using Chai
   */
  convertNodeBuffersToPOJOs (value) {
    if (value && (value._isBuffer || (value.constructor && value.constructor.name === "Buffer"))) {
      // Convert Buffers to POJOs for comparison
      value = value.toJSON();

      if (host.node && host.node.version === 0.1) {
        // Node v0.10 serializes buffers differently
        value = { type: "Buffer", data: value };
      }
    }
    return value;
  },

  /**
   * Creates a deep clone of the given value.
   */
  cloneDeep (value) {
    let clone = value;
    if (value && typeof (value) === "object") {
      clone = value instanceof Array ? [] : {};
      let keys = Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        clone[keys[i]] = helper.cloneDeep(value[keys[i]]);
      }
    }
    return clone;
  },
};
