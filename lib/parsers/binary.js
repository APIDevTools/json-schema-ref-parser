'use strict';

var Promise = require('../util/promise');

var BINARY_REGEXP = /\.(jpeg|jpg|gif|png|bmp|ico)$/i;

module.exports = {
  /**
   * The order that this parser will run, in relation to other parsers.
   *
   * @type {number}
   */
  order: 400,

  /**
   * Whether to allow "empty" files (zero bytes).
   *
   * @type {boolean}
   */
  allowEmpty: true,

  /**
   * Determines whether this parser can parse a given file reference.
   * Parsers that return true will be tried, in order, until one successfully parses the file.
   * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
   * every parser will be tried.
   *
   * @param {object}  info        - An object containing information about the referenced file
   * @param {string}  info.url    - The full URL of the referenced file
   * @param {*}       info.data   - The file contents. This will be whatever data type was returned by the resolver
   * @returns {boolean}
   */
  canParse: function isBinary(info) {
    // Use this parser if the file is a Buffer, and has a known binary extension
    return Buffer.isBuffer(info.data) && BINARY_REGEXP.test(info.url);
  },

  /**
   * Parses the given data as a Buffer (byte array).
   *
   * @param {object}  info        - An object containing information about the referenced file
   * @param {string}  info.url    - The full URL of the referenced file
   * @param {*}       info.data   - The file contents. This will be whatever data type was returned by the resolver
   * @returns {Promise<Buffer>}
   */
  parse: function parseBinary(info) {
    return new Promise(function(resolve, reject) {
      if (Buffer.isBuffer(info.data)) {
        resolve(info.data);
      }
      else {
        // This will reject if data is anything other than a string or typed array
        resolve(new Buffer(info.data));
      }
    });
  }
};
