'use strict';

var ono = require('ono');
var debug = require('./util/debug');
var plugins = require('./util/plugins');
var Promise = require('./util/promise');

module.exports = parseFile;

/**
 * Parses a file's raw data into a JavaScript value. The raw data is typically a string
 * (such as JSON or YAML) or a byte array. The parsed value can be ANY JavaScript value,
 * including an object, array, string, number, null, undefined, NaN, etc.
 *
 * This method just calls the parser plug-ins, which do the actual work.
 *
 * @param {File} file
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<File>}
 * The same {@link File} object is returned. Its {@link File#data}, {@link File#dataType}, and
 * {@link File#parsed} properties will be set.
 */
function parseFile(file, options) {
  return new Promise(function(resolve, reject) {
    debug('Parsing %s', file.url);

    // Find the parsers that can read this file type.
    // If none of the parsers are an exact match for this file, then we'll try ALL of them.
    // This handles situations where the file IS a supported type, just with an unknown extension.
    var allParsers = plugins.all(options.parse);
    var filteredParsers = plugins.filter(allParsers, 'canParse', file);
    var parsers = filteredParsers.length > 0 ? filteredParsers : allParsers;

    // Run the parsers, in order, until one of them succeeds
    plugins.sort(parsers);
    plugins.run(parsers, 'parse', file).then(onSuccess, onError);

    function onSuccess(parser) {
      debug('%s was parsed as %s', file.url, parser.plugin.name);

      if (!parser.plugin.allowEmpty && isEmpty(parser.result)) {
        reject(ono.syntax('Error parsing "%s" as %s. \nParsed value is empty', file.url, parser.plugin.name));
      }

      file.data = parser.result;
      file.dataType = parser.plugin.name;
      file.parsed = true;
      resolve(file);
    }

    function onError(err) {
      if (err) {
        err = err instanceof Error ? err : new Error(err);
        reject(ono.syntax(err, 'Error parsing %s', file.url));
      }
      else {
        reject(ono.syntax('Unable to parse %s', file.url));
      }
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
  return value === undefined ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Buffer.isBuffer(value) && value.length === 0);
}
