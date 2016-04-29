'use strict';

var FileArray = require('./file-array');

module.exports = Schema;

/**
 * This class represents a JSON Schema.
 * It contains information about all the files in the schema, and provides methods to traverse
 * the schema and get/set values within it using JSON references.
 */
function Schema() {
  /**
   * All of the files in the schema, including the main schema file itself
   *
   * @type {File[]}
   * @readonly
   */
  this.files = new FileArray();

  /**
   * Indicates whether the schema contains any circular references.
   *
   * @type {boolean}
   * @readonly
   */
  this.circular = false;
}

Object.defineProperties(Schema.prototype, {
  /**
   * The parsed JSON Schema.
   *
   * @type {object|null}
   */
  root: {
    configurable: true,
    enumerable: true,
    get: function() {
      if (this.files.length === 0) {
        return null;
      }
      return this.files[0].data;
    }
  },

  /**
   * The URL of the main JSON Schema file.
   *
   * @type {string|null}
   */
  rootUrl: {
    configurable: true,
    enumerable: true,
    get: function() {
      if (this.files.length === 0) {
        return null;
      }
      return this.files[0].url;
    }
  },

  /**
   * The main JSON Schema file.
   *
   * @type {File}
   */
  rootFile: {
    configurable: true,
    enumerable: true,
    get: function() {
      return this.files[0] || null;
    }
  },
});

/**
 * Determines whether a given value exists in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to check.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @returns {boolean}      - Returns true if the value exists, or false otherwise
 */
Schema.prototype.exists = function(pointer) {
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};

/**
 * Finds a value in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to get.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @returns {*}            - Returns the specified value, which can be ANY JavaScript type, including
 *                           an object, array, string, number, null, undefined, NaN, etc.
 *                           If the value is not found, then an error is thrown.
 */
Schema.prototype.get = function(pointer) {
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};

/**
 * Sets a value in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to set.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @param {*}      value   - The value to assign. This can be ANY JavaScript type, including
 *                           an object, array, string, number, null, undefined, NaN, etc.
 */
Schema.prototype.set = function(pointer, value) {
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};
