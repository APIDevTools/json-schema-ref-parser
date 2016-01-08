'use strict';

module.exports = parseBinary;

/**
 * The order that this parser will run, in relation to other parsers.
 */
module.exports.order = 4;

/**
 * Whether to allow "empty" files (zero bytes).
 */
module.exports.empty = true;

/**
 * File extensions and/or RegExp patterns that will be parsed by this parser.
 */
module.exports.ext = [
  '.jpeg', '.jpg', '.gif', '.png', '.bmp', '.ico'
];

/**
 * Parses the given data as a Buffer (byte array).
 *
 * @param {Buffer} data - The data to be parsed
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 * @returns {Buffer}
 */
function parseBinary(data, path, options) {
  // data is already a Buffer
  return data;
}
