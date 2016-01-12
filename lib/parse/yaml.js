'use strict';

var Promise = require('../util/promise'),
    YAML    = require('../util/yaml');

module.exports = parseYAML;

/**
 * The order that this parser will run, in relation to other parsers.
 */
module.exports.order = 200;

/**
 * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
 */
module.exports.empty = true;

/**
 * File extensions and/or RegExp patterns that will be parsed by this parser.
 */
module.exports.ext = ['.yaml', '.yml', '.json'];  // <--- JSON is valid YAML

/**
 * Parses the given data as YAML
 *
 * @param {*} data - The data to be parsed
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 * @returns {Promise}
 */
function parseYAML(data, path, options) {
  return new Promise(function(resolve, reject) {
    if (Buffer.isBuffer(data)) {
      var yaml = data.toString();
      resolve(YAML.parse(yaml));
    }
    else if (typeof data === 'string') {
      resolve(YAML.parse(data));
    }
    else {
      // data is already a JavaScript value (object, array, number, null, NaN, etc.)
      resolve(data);
    }
  });
}
