'use strict';
var fs      = require('fs'),
    ono     = require('ono'),
    Promise = require('../util/promise'),
    url     = require('../util/url'),
    debug   = require('../util/debug');

module.exports = {
  /**
   * The order that this resolver will run, in relation to other resolvers.
   *
   * @type {number}
   */
  order: 100,

  /**
   * How long a file's contents will be cached before the file is re-read.
   * Setting this to zero disables caching and the file will be re-read every time.
   *
   * @type {number} - The number of milliseconds to cache files
   */
  cache: 60000,  // 1 minute

  /**
   * Determines whether this resolver can read a given file reference.
   * Resolvers that return true will be tried, in order, until one successfully resolves the file.
   * Resolvers that return false will not be given a chance to resolve the file.
   *
   * @param {object} info       - An object containing information about the referenced file
   * @param {string} info.url   - The full URL of the referenced file
   * @returns {boolean}
   */
  canRead: function isFile(info) {
    return !process.browser && !url.isFilePath(info.url);
  },

  /**
   * Reads the given file and returns its raw contents as a Buffer.
   *
   * @param {object} info       - An object containing information about the referenced file
   * @param {string} info.url   - The full URL of the referenced file
   * @returns {Promise<Buffer>}
   */
  read: function readFile(info) {
    return new Promise(function(resolve, reject) {
      var path;
      try {
        path = url.toLocalFilePath(info.url);
      }
      catch (err) {
        reject(ono.uri(err, 'Malformed URI: %s', info.url));
      }

      debug('Opening file: %s', path);

      try {
        fs.readFile(path, function(err, data) {
          if (err) {
            reject(ono(err, 'Error opening file "%s"', path));
          }
          else {
            resolve(data);
          }
        });
      }
      catch (err) {
        reject(ono(err, 'Error opening file "%s"', path));
      }
    });
  }
};
