'use strict';

var Promise = require('../util/promise');

module.exports = parseJSON;

/**
 * The order that this parser will run, in relation to other parsers.
 */
module.exports.order = 100;

/**
 * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
 */
module.exports.empty = true;

/**
 * File extensions and/or RegExp patterns that will be parsed by this parser.
 */
module.exports.ext = ['.json'];

/**
 * Parses the given data as JSON
 *
 * @param {*} data - The data to be parsed
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 * @returns {Promise}
 */
function parseJSON(data, path, options) {
  return new Promise(function(resolve, reject) {
    if (Buffer.isBuffer(data)) {
      var json = data.toString();
      resolve(JSON.parse(json));
    }
    else if (typeof data === 'string') {
      if (data.trim().length === 0) {
        resolve(null);  // This mirrors the YAML behavior
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
