'use strict';
/* eslint lines-around-comment: [2, {beforeBlockComment: false}] */
exports.__esModule = true;
var json_1 = require('./parsers/json');
var yaml_1 = require('./parsers/yaml');
var text_1 = require('./parsers/text');
var binary_1 = require('./parsers/binary');
var file_1 = require('./resolvers/file');
var http_1 = require('./resolvers/http');
/**
 * Options that determine how JSON schemas are parsed, resolved, and dereferenced.
 */
var $RefParserOptions = /** @class */ (function () {
  /**
     * @param {object|$RefParserOptions} [options] - Overridden options
     */
  function $RefParserOptions (options) {
    /**
         * Determines how different types of files will be parsed.
         *
         * You can add additional parsers of your own, replace an existing one with
         * your own implemenation, or disable any parser by setting it to false.
         */
    this.parse = merge({}, $RefParserOptions.defaults.parse);
    /**
         * Determines how JSON References will be resolved.
         *
         * You can add additional resolvers of your own, replace an existing one with
         * your own implemenation, or disable any resolver by setting it to false.
         */
    this.resolve = merge({}, $RefParserOptions.defaults.resolve);
    /**
         * Determines the types of JSON references that are allowed.
         */
    this.dereference = merge({}, $RefParserOptions.defaults.dereference);
    merge(this, options);
  }
  $RefParserOptions.defaults = {
    /**
         * Determines how different types of files will be parsed.
         *
         * You can add additional parsers of your own, replace an existing one with
         * your own implemenation, or disable any parser by setting it to false.
         */
    parse: {
      json: json_1.default,
      yaml: yaml_1.default,
      text: text_1.default,
      binary: binary_1.default
    },
    /**
         * Determines how JSON References will be resolved.
         *
         * You can add additional resolvers of your own, replace an existing one with
         * your own implemenation, or disable any resolver by setting it to false.
         */
    resolve: {
      file: file_1.default,
      http: http_1.default,
      /**
             * Determines whether external $ref pointers will be resolved.
             * If this option is disabled, then none of above resolvers will be called.
             * Instead, external $ref pointers will simply be ignored.
             *
             * @type {boolean}
             */
      external: true
    },
    /**
         * Determines the types of JSON references that are allowed.
         */
    dereference: {
      /**
             * Dereference circular (recursive) JSON references?
             * If false, then a {@link ReferenceError} will be thrown if a circular reference is found.
             * If "ignore", then circular references will not be dereferenced.
             *
             * @type {boolean|string}
             */
      circular: true
    }
  };
  return $RefParserOptions;
}());
exports.default = $RefParserOptions;
/**
 * Merges the properties of the source object into the target object.
 *
 * @param {object} target - The object that we're populating
 * @param {?object} source - The options that are being merged
 * @returns {object}
 */
function merge (target, source) {
  if (isMergeable(source)) {
    var keys = Object.keys(source);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var sourceSetting = source[key];
      var targetSetting = target[key];
      if (isMergeable(sourceSetting)) {
        // It's a nested object, so merge it recursively
        target[key] = merge(targetSetting || {}, sourceSetting);
      }
      else if (sourceSetting !== undefined) {
        // It's a scalar value, function, or array. No merging necessary. Just overwrite the target value.
        target[key] = sourceSetting;
      }
    }
  }
  return target;
}
/**
 * Determines whether the given value can be merged,
 * or if it is a scalar value that should just override the target value.
 *
 * @param   {*}  val
 * @returns {Boolean}
 */
function isMergeable (val) {
  return (val &&
        typeof val === 'object' &&
        !Array.isArray(val) &&
        !(val instanceof RegExp) &&
        !(val instanceof Date));
}
