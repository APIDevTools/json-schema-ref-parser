'use strict';

var Promise = require('../util/promise');

var JSON_REGEXP = /\.json$/i;

module.exports = {
  /**
   * The order that this parser will run, in relation to other parsers.
   *
   * @type {number}
   */
  order: 100,

  /**
   * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
   *
   * @type {boolean}
   */
  allowEmpty: true,

  /**
   * Determines whether this parser can parse a given file reference.
   * Parsers that return true will be tried, in order, until one successfully parses the file.
   * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
   * every parser will be tried.
   *
   * @param {object}  info        - An object containing information about the referenced file
   * @param {string}  info.url    - The full URL of the referenced file
   * @param {*}       info.data   - The file contents. This will be whatever data type was returned by the resolver
   * @returns {boolean}
   */
  canParse: function isJSON(info) {
    // If the file explicitly has a ".json" extension, then use this parser.
    // Otherwise, allow other parsers to give it a shot.
    return JSON_REGEXP.test(info.url);
  },

  /**
   * Parses the given file as JSON
   *
   * @param {object}  info        - An object containing information about the referenced file
   * @param {string}  info.url    - The full URL of the referenced file
   * @param {*}       info.data   - The file contents. This will be whatever data type was returned by the resolver
   * @returns {Promise}
   */
  parse: function parseJSON(info) {
    return new Promise(function(resolve, reject) {
      var data = info.data;
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }

      if (typeof data === 'string') {
        if (data.trim().length === 0) {
          resolve(undefined);  // This mirrors the YAML behavior
        }
        else {
          resolve(JSON.parse(data));
        }
      }
      else {
        // data is already a JavaScript value (object, array, number, null, NaN, etc.)
        resolve(data);
      }
    });
  }
};
