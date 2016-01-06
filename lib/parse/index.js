'use strict';

var util    = require('../util'),
    Promise = require('../util/promise'),
    ono     = require('ono');

module.exports = parse;

/**
 * Parses the given data according to the given options.
 *
 * @param {Buffer} data - The data to be parsed
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<string|Buffer|object>}
 */
function parse(data, path, options) {
  return new Promise(function(resolve, reject) {
    // Check each parser, in order, until one matches this file
    var pathExt = util.path.extname(path);
    var matchingParser, parserType, allowEmpty;
    util.runInOrder(options.parse, function(type, parser) {
      parser.ext.some(function(ext) {
        if (ext === pathExt ||
          (ext instanceof RegExp && ext.test(path))) {
          matchingParser = parser;
          parserType = type;
          allowEmpty = parser.empty;
          return true;
        }
      });
    });

    // If one of the parsers matched, then wait on it
    if (matchingParser) {
      util.debug('Parsing "%s" as %s', path, parserType);

      matchingParser(data, path, options)
      .then(
        function(value) {
          if (!allowEmpty && isEmpty(value)) {
            reject(ono.syntax('Error parsing "%s" as %s. \nParsed value is empty', path, parserType));
          }
          else {
            resolve(value);
          }
        },
        function(err) {
          reject(ono.syntax(err, 'Error parsing "%s" as %s', path, parserType));
        });
    }
    else {
      reject(ono.syntax('Unable to parse "%s"', path));
    }
  });
}

/**
 * Determines whether the parsed value is "empty".
 *
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return !value ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Buffer.isBuffer(value) && value.length === 0);
}
