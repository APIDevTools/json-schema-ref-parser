'use strict';
var fs      = require('fs'),
    ono     = require('ono'),
    Promise = require('../util/promise'),
    util    = require('../util');

module.exports = readFile;

/**
 * The order that this reader will run, in relation to other readers.
 */
module.exports.order = 1;

/**
 * How long a file's contents will be cached before the file is re-read.
 * Setting this to zero disables caching and the file will be re-read every time.
 */
module.exports.cache = 60000;  // 1 minute

/**
 * Reads the given file path and returns its raw contents as a Buffer.
 *
 * @param {string} path - The file path to read
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<Buffer>|undefined}
 * If `path` is NOT a supported file path, then `undefiend` is returned.
 * Otherwise, a Promise is returned, and it will resolve with the file contents as a Buffer.
 */
function readFile(path, options) {
  if (process.browser || util.path.isUrl(path)) {
    return Promise.reject(new SyntaxError('Not a local file'));
  }

  return new Promise(function(resolve, reject) {
    var file;
    try {
      file = util.path.urlToLocalPath(path);
    }
    catch (err) {
      reject(ono.uri(err, 'Malformed URI: %s', path));
    }

    util.debug('Opening file: %s', file);

    try {
      fs.readFile(file, function(err, data) {
        if (err) {
          reject(ono(err, 'Error opening file "%s"', file));
        }
        else {
          resolve(data);
        }
      });
    }
    catch (err) {
      reject(ono(err, 'Error opening file "%s"', file));
    }
  });
}
