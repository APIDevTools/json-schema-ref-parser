'use strict';

module.exports = parseText;

/**
 * The order that this parser will run, in relation to other parsers.
 */
module.exports.order = 3;

/**
 * Whether to allow "empty" files (zero bytes).
 */
module.exports.empty = true;

/**
 * The encoding that the text is expected to be in.
 */
module.exports.encoding = 'utf8';

/**
 * File extensions and/or RegExp patterns that will be parsed by this parser.
 */
module.exports.ext = [
  '.txt', '.htm', '.html', '.md', '.xml', '.js', '.min', '.map',
  '.css', '.scss', '.less', '.svg'
];

/**
 * Parses the given data as text
 *
 * @param {Buffer} data - The data to be parsed
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 * @returns {string}
 */
function parseText(data, path, options) {
  return data.toString(options.parse.text.encoding);
}
