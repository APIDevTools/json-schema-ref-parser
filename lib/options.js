'use strict';

var _merge = require('lodash/object/merge');

module.exports = ParserOptions;

/**
 * Options that determine how JSON schemas are parsed, dereferenced, and cached.
 *
 * @param {object|ParserOptions} [options] - Overridden options
 * @constructor
 */
function ParserOptions(options) {
  /**
   * Determines what types of files can be parsed
   */
  this.allow = {
    /**
     * Are JSON files allowed? If false, then all schemas must be in YAML format.
     * @type {boolean}
     */
    json: true,

    /**
     * Are YAML files allowed? If false, then all schemas must be in JSON format.
     * @type {boolean}
     */
    yaml: true,

    /**
     * Are zero-byte files allowed? If false, then an error will be thrown if a file is empty.
     * @type {boolean}
     */
    empty: true,

    /**
     * Can unknown file types be $referenced?
     * If true, then they will be parsed as Buffers (byte arrays).
     * If false, then an error will be thrown.
     * @type {boolean}
     */
    unknown: true
  };

  /**
   * Determines the types of JSON references that are allowed.
   */
  this.$refs = {
    /**
     * Allow JSON references to other parts of the same file?
     * @type {boolean}
     */
    internal: true,

    /**
     * Allow JSON references to external files/URLs?
     * @type {boolean}
     */
    external: true
  };

  /**
   * How long to cache files (in seconds).
   */
  this.cache = {
    /**
     * How long to cache local files, in seconds.
     * @type {number}
     */
    fs: 60, // 1 minute

    /**
     * How long to cache files downloaded via HTTP, in seconds.
     * @type {number}
     */
    http: 5 * 60, // 5 minutes

    /**
     * How long to cache files downloaded via HTTPS, in seconds.
     * @type {number}
     */
    https: 5 * 60 // 5 minutes
  };

  _merge(this, options);
}
