'use strict';
var fs = require('fs');
var ono = require('ono');
var Promise = require('../util/promise');
var URL = require('../util/url');
var debug = require('../util/debug');

module.exports = {
  /**
   * The order that this reader will run, in relation to other readers.
   *
   * @type {number}
   */
  order: 100,

  /**
   * Determines whether this reader can read a given file.
   * Readers that return true will be tried in order, until one successfully reads the file.
   * Readers that return false will not be given a chance to read the file.
   *
   * @param {File} file - A {@link File} object containing the URL to be read
   * @returns {boolean}
   */
  canRead: function isFile(file) {
    return URL.isFileSystemPath(file.url);
  },

  /**
   * Reads the given file and returns its raw contents as a Buffer.
   *
   * @param {File} file - A {@link File} object containing the data to be parsed
   * @returns {Promise<Buffer>}
   */
  read: function readFile(file) {
    return new Promise(function(resolve, reject) {
      try {
        file.path = URL.toFileSystemPath(file.url);
      }
      catch (err) {
        reject(ono.uri(err, 'Malformed URI: %s', file.url));
      }

      debug('Opening file: %s', file.path);

      try {
        fs.readFile(file.path, function(err, data) {
          if (err) {
            reject(ono(err, 'Error opening file "%s"', file.path));
          }
          else {
            resolve(data);
          }
        });
      }
      catch (err) {
        reject(ono(err, 'Error opening file "%s"', file.path));
      }
    });
  }
};
