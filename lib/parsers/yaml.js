'use strict';

var Promise = require('../util/promise');
var yaml = require('js-yaml');
var ono = require('ono');

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
   * Determines whether this parser can parse a given file.
   * Parsers that return true will be tried, in order, until one successfully parses the file.
   * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
   * every parser will be tried.
   *
   * @type {RegExp|string[]|function}
   */
  canParse: ['.yaml', '.yml', '.json'],  // JSON is valid YAML

  /**
   * Parses the given file as YAML
   *
   * @param {File} file - A {@link File} object containing the data to be parsed
   * @returns {Promsie}
   */
  parse: function parseYAML(file) {
    var parsed;

    return new Promise(function(resolve, reject) {
      var data = file.data;
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      }

      if (typeof data === 'string') {
        try {
          parsed = yaml.safeLoad(data);
        }
        catch (e) {
          if (e instanceof Error) {
            throw e;
          }
          else {
            // https://github.com/nodeca/js-yaml/issues/153
            throw ono(e, e.message);
          }
        }
        resolve(parsed);
      }
      else {
        // data is already a JavaScript value (object, array, number, null, NaN, etc.)
        resolve(data);
      }
    });
  }
};
