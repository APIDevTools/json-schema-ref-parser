'use strict';

module.exports = parseJSON;

/**
 * The order that this parser will run, in relation to other parsers.
 */
module.exports.order = 1;

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
 * @param {Buffer} data - The data to be parsed
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 * @returns {object}
 */
function parseJSON(data, path, options) {
  return JSON.parse(data.toString());
}
