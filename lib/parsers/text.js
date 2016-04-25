'use strict';

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
   * Determines whether this parser can parse a given file.
   * Parsers that return true will be tried, in order, until one successfully parses the file.
   * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
   * every parser will be tried.
   *
   * @param {File} file - A {@link File} object containing the data to be parsed
   * @returns {boolean}
   */
  canParse: function isText(file) {
    // Use this parser if the file is a string or Buffer, and has a known text-based extension
    return (typeof file.data === 'string' || Buffer.isBuffer(file.data)) && TEXT_REGEXP.test(file.url);
  },

  /**
   * Parses the given file as text
   *
   * @param {File} file - A {@link File} object containing the data to be parsed
   * @returns {string}
   */
  parse: function parseText(file) {
    if (typeof file.data === 'string') {
      return file.data;
    }
    else if (Buffer.isBuffer(file.data)) {
      return file.data.toString(this.encoding);
    }
    else {
      throw new Error('data is not text');
    }
  }
};
