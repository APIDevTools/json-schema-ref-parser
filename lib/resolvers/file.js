'use strict';
exports.__esModule = true;
var fs = require('fs');
var ono = require('ono');
var url_1 = require('../util/url');
var debug_1 = require('../util/debug');
exports.default = {
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
     * @param {object} file           - An object containing information about the referenced file
     * @param {string} file.url       - The full URL of the referenced file
     * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
     * @returns {boolean}
     */
  canRead: function isFile (file) {
    return url_1.isFileSystemPath(file.url);
  },
  /**
     * Reads the given file and returns its raw contents as a Buffer.
     *
     * @param {object} file           - An object containing information about the referenced file
     * @param {string} file.url       - The full URL of the referenced file
     * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
     * @returns {Promise<Buffer>}
     */
  read: function readFile (file) {
    return new Promise(function (resolve, reject) {
      var path;
      try {
        path = url_1.toFileSystemPath(file.url);
      }
      catch (err) {
        reject(ono.uri(err, 'Malformed URI: %s', file.url));
      }
      debug_1.default('Opening file: %s', path);
      try {
        fs.readFile(path, function (err, data) {
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
