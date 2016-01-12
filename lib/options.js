/* eslint lines-around-comment: [2, {beforeBlockComment: false}] */
'use strict';

var parseJSON   = require('./parse/json'),
    parseYAML   = require('./parse/yaml'),
    parseText   = require('./parse/text'),
    parseBinary = require('./parse/binary'),
    readFile    = require('./read/file'),
    readHttp    = require('./read/http'),
    util        = require('./util');

module.exports = $RefParserOptions;

/**
 * Options that determine how JSON schemas are parsed, dereferenced, and cached.
 *
 * @param {object|$RefParserOptions} [options] - Overridden options
 * @constructor
 */
function $RefParserOptions(options) {
  /**
   * Determines how different types of files will be parsed.
   *
   * You can add additional parsers of your own, replace an existing one with
   * your own implemenation, or disable any parser by setting it to false.
   *
   * Each of the built-in parsers has the following options:
   *
   *  order   {number}    - The order in which the parsers will run
   *
   *  ext     {string[]}  - An array of file extensions and/or RegExp patterns.
   *                        Only matching files will be parsed by this parser.
   *
   *  empty   {boolean}   - Whether to allow "empty" files. Enabled by default.
   *                        "Empty" includes zero-byte files, as well as JSON/YAML files that
   *                        don't contain any keys.
   */
  this.parse = {
    json: parseJSON,
    yaml: parseYAML,
    text: parseText,
    binary: parseBinary,
  };

  /**
   * Determines how external JSON References will be resolved.
   *
   * You can add additional readers of your own, replace an existing one with
   * your own implemenation, or disable any reader by setting it to false.
   *
   * Each of the built-in readers has the following options:
   *
   *  order   {number}    - The order in which the reader will run
   *
   *  cache   {number}    - How long to cache files (in milliseconds)
   *                        The default cache duration is different for each reader.
   *                        Setting the cache duration to zero disables caching for that reader.
   *
   * The HTTP reader has additional options.  See read/http.js for details.
   */
  this.resolve = {
    file: readFile,
    http: readHttp,

    /**
     * Determines whether external $ref pointers will be resolved.
     * If this option is disabled, then none of above resolvers will be called.
     * Instead, external $ref pointers will simply be ignored.
     *
     * @type {boolean}
     */
    external: true,
  };

  /**
   * Determines the types of JSON references that are allowed.
   */
  this.dereference = {
    /**
     * Dereference circular (recursive) JSON references?
     * If false, then a {@link ReferenceError} will be thrown if a circular reference is found.
     * If "ignore", then circular references will not be dereferenced.
     *
     * @type {boolean|string}
     */
    circular: true
  };

  merge(options, this);
}

/**
 * Merges user-specified options with default options.
 *
 * @param {?object} user - The options that were specified by the user
 * @param {$RefParserOptions} defaults - The {@link $RefParserOptions} object that we're populating
 * @returns {*}
 */
function merge(user, defaults) {
  if (user) {
    var keys = Object.keys(user);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var userSetting = user[key];
      var defaultSetting = defaults[key];

      if (userSetting && typeof userSetting === 'object' && !Array.isArray(userSetting)) {
        if (typeof defaultSetting === 'function') {
          // Create a copy of the default function, so the user can safely modify its options
          defaultSetting = merge(defaultSetting, util.bind(defaultSetting));
        }

        // Merge the user-sepcified options for this object/function
        defaults[key] = merge(userSetting, defaultSetting || {});
      }
      else {
        // A scalar value, function, or array. So override the default value.
        defaults[key] = userSetting;
      }
    }
  }
  return defaults;
}
