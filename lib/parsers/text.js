'use strict';

var Promise = require('../util/promise');

var TEXT_REGEXP = /\.(txt|htm|html|md|xml|js|min|map|css|scss|less|svg)$/i;

module.exports = {
  /**
   * The order that this parser will run, in relation to other parsers.
   *
   * @type {number}
   */
  order: 300,

  /**
   * Whether to allow "empty" files (zero bytes).
   *
   * @type {boolean}
   */
  allowEmpty: true,

  /**
   * The encoding that the text is expected to be in.
   *
   * @type {string}
   */
  encoding: 'utf8',

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
  canParse: function isText(info) {
    // Use this parser if the file is a string or Buffer, and has a known text-based extension
    return (typeof info.data === 'string' || Buffer.isBuffer(info.data)) && TEXT_REGEXP.test(info.url);
  },

  /**
   * Parses the given file as text
   *
   * @param {object}  info        - An object containing information about the referenced file
   * @param {string}  info.url    - The full URL of the referenced file
   * @param {*}       info.data   - The file contents. This will be whatever data type was returned by the resolver
   * @returns {Promise<string>}
   */
  parse: function parseText(info) {
    var me = this;

    return new Promise(function(resolve, reject) {
      if (typeof info.data === 'string') {
        resolve(info.data);
      }
      else if (Buffer.isBuffer(info.data)) {
        resolve(info.data.toString(me.encoding));
      }
      else {
        reject(new Error('data is not text'));
      }
    });
  }
};
