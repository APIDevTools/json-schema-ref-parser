'use strict';

var Promise = require('../util/promise'),
    YAML    = require('../util/yaml');

var YAML_REGEXP = /\.(yaml|yml|json)$/i;  // JSON is valid YAML

module.exports = {
  /**
   * The order that this parser will run, in relation to other parsers.
   *
   * @type {number}
   */
  order: 200,

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
   * @param {object}  file        - An object containing information about the referenced file
   * @param {string}  file.url    - The full URL of the referenced file
   * @param {*}       file.data   - The file contents. This will be whatever data type was returned by the resolver
   * @returns {boolean}
   */
  canParse: function isYAML(file) {
    // If the file has a YAML or JSON extension, then use this parser.
    return YAML_REGEXP.test(file.url);
  },

  /**
   * Parses the given file as YAML
   *
   * @param {object}  file        - An object containing information about the referenced file
   * @param {string}  file.url    - The full URL of the referenced file
   * @param {*}       file.data   - The file contents. This will be whatever data type was returned by the resolver
   * @returns {Promise}
   */
  parse: function parseYAML(file) {
    return new Promise(function(resolve, reject) {
      var data = file.data;
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }

      if (typeof data === 'string') {
        resolve(YAML.parse(data));
      }
      else {
        // data is already a JavaScript value (object, array, number, null, NaN, etc.)
        resolve(data);
      }
    });
  }
};
