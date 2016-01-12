'use strict';

var util    = require('../util'),
    Promise = require('../util/promise'),
    ono     = require('ono');

module.exports = parse;

/**
 * Parses the given data according to the given options.
 *
 * @param {*} data - The data to be parsed
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<string|Buffer|object>}
 */
function parse(data, path, options) {
  return new Promise(function(resolve, reject) {
    util.debug('Parsing %s', path);
    var parsers = getSortedParsers(path, options);
    util.runOrderedFunctions(parsers, data, path, options).then(onParsed, onError);

    function onParsed(parser) {
      if (!parser.fn.empty && isEmpty(parser.result)) {
        reject(ono.syntax('Error parsing "%s" as %s. \nParsed value is empty', path, parser.name));
      }
      else {
        resolve(parser.result);
      }
    }

    function onError(err) {
      if (err) {
        reject(ono.syntax(err, 'Error parsing %s', path));
      }
      else {
        reject(ono.syntax('Unable to parse %s', path));
      }
    }
  });
}

/**
 * Returns the parsers for the given file, sorted by how likely they are  to successfully
 * parse the file.  For example, a ".yaml" file is more likely to be successfully parsed
 * by the YAML parser than by the JSON, Text, or Binary parsers.  Whereas a ".jpg" file
 * is more likely to be successfully parsed by the Binary parser.
 *
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 * @returns {{name: string, order: number, score: number, fn: function}[]}
 */
function getSortedParsers(path, options) {
  var ext = util.path.extname(path);
  var bestScore = 3;

  return util.getOrderedFunctions(options.parse)
    // Score each parser
    .map(function(parser) {
      var scoredParser = {
        score: score(path, ext, parser.fn.ext),
        order: parser.order,
        name: parser.name,
        fn: parser.fn,
      };
      bestScore = Math.min(scoredParser.score, bestScore);
      return scoredParser;
    })

    // Only return parsers that scored 1 (exact match) or 2 (pattern match).
    // If NONE of the parsers matched, then return ALL of them
    .filter(function(parser) { return bestScore === 3 || parser.score < 3; })

    // Sort by score (exact matches come first)
    .sort(function(a, b) { return a.score - b.score; });
}

/**
 * Returns a "score", based on how well the given file matches the given patterns.
 *
 * @param {string} path - The full file path or URL
 * @param {string} ext - The file extension
 * @param {array} patterns - An array of file extensions (strings) or RegExp patterns
 * @returns {number} - 1 = exact match, 2 = pattern match, 3 = no match
 */
function score(path, ext, patterns) {
  var bestScore = 3;
  patterns = Array.isArray(patterns) ? patterns : [patterns];
  for (var i = 0; i < patterns.length; i++) {
    var pattern = patterns[i];
    if (pattern === ext) {
      return 1;
    }
    if (pattern instanceof RegExp && pattern.test(path)) {
      bestScore = Math.min(bestScore, 2);
    }
  }
  return bestScore;
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
