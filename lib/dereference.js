'use strict';

var $Ref      = require('./ref'),
    util      = require('./util'),
    url       = require('url'),
    _forEach  = require('lodash/collection/forEach'),
    _isArray  = require('lodash/lang/isArray'),
    _isObject = require('lodash/lang/isObject');

module.exports = dereference;

/**
 * Crawls the JSON schema, finds all JSON references, and dereferences them.
 * This method mutates the JSON schema object, replacing JSON references with their resolved value.
 *
 * @param {$RefParser} parser
 * @param {ParserOptions} options
 */
function dereference(parser, options) {
  util.debug('Dereferencing $ref pointers in %s', parser._basePath);
  crawl(parser.schema, parser._basePath + '#', [], parser.$refs, options);
}

/**
 * Recursively crawls the given value, and dereferences any JSON references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} path - The path to use for resolving relative JSON references
 * @param {object[]} parents - An array of the parent objects that have already been dereferenced
 * @param {$Refs} $refs - The resolved JSON references
 * @param {ParserOptions} options
 */
function crawl(obj, path, parents, $refs, options) {
  if (_isObject(obj) || _isArray(obj)) {
    parents.push(obj);

    _forEach(obj, function(value, key) {
      var keyPath = path + '/' + key;

      if ($Ref.isAllowed(value, options)) {
        // We found a $ref, so resolve it
        util.debug('Dereferencing $ref pointer "%s" at %s', value.$ref, keyPath);
        var $refPath = url.resolve(path, value.$ref);
        var resolved$Ref = $refs._resolve($refPath, options);

        // Dereference the JSON reference
        obj[key] = value = resolved$Ref.value;

        // Crawl the dereferenced value (unless it's circular)
        if (parents.indexOf(value) === -1) {
          crawl(resolved$Ref.value, resolved$Ref.path + '#', parents, $refs, options);
        }
      }
      else if (parents.indexOf(value) === -1) {
        crawl(value, keyPath, parents, $refs, options);
      }
    });

    parents.pop();
  }
}
