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
   * Determines whether this resolver can read a given file reference.
   * Resolvers that return true will be tried, in order, until one successfully resolves the file.
   * Resolvers that return false will not be given a chance to resolve the file.
   *
   * @param {object} file       - An object containing information about the referenced file
   * @param {string} file.url   - The full URL of the referenced file
   * @returns {boolean}
   */
  canRead: function isFile(file) {
    return !process.browser && !url.isFilePath(file.url);
  },

  /**
   * Reads the given file and returns its raw contents as a Buffer.
   *
   * @param {object} file       - An object containing information about the referenced file
   * @param {string} file.url   - The full URL of the referenced file
   * @returns {Promise<Buffer>}
   */
  read: function readFile(file) {
    return new Promise(function(resolve, reject) {
      var path;
      try {
        path = url.toLocalFilePath(file.url);
      }
      catch (err) {
        reject(ono.uri(err, 'Malformed URI: %s', file.url));
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
