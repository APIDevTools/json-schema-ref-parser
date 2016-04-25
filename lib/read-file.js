'use strict';

var ono = require('ono');
var debug = require('./util/debug');
var plugins = require('./util/plugins');
var Promise = require('./util/promise');

module.exports = readFile;

/**
 * Reads a file. Depending on the file's URL, this may mean reading the file from disk,
 * downloading it, querying it from a database, etc.
 *
 * This method just calls the reader plug-ins, which do the actual work.
 *
 * @param {File} file
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<File>}
 * The same {@link File} object is returned. Its {@link File#data} and {@link File#urlType}
 * properties will both be set.
 */
function readFile(file, options) {
  return new Promise(function(resolve, reject) {
    debug('Resolving %s', file.url);

    // Find the readers that can read this file
    var readers = plugins.all(options.read);
    readers = plugins.filter(readers, 'canRead', file);

    // Run the readers, in order, until one of them succeeds
    plugins.sort(readers);
    plugins.run(readers, 'read', file).then(onSuccess, onError);

    function onSuccess(reader) {
      debug('%s was read as a %s path', file.url, reader.plugin.name);
      file.urlType = reader.plugin.name;
      file.data = reader.result;
      resolve(file);
    }

    function onError(err) {
      reject(ono.syntax(err, 'Unable to read "%s"', file.url));
    }
  });
}
