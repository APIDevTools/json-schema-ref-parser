'use strict';

var $Ref = require('./ref'),
    util = require('./util'),
    url  = require('url');

module.exports = dereference;

/**
 * Crawls the JSON schema, finds all JSON references, and dereferences them.
 * This method mutates the JSON schema object, replacing JSON references with their resolved value.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 */
function dereference(parser, options) {
  util.debug('Dereferencing $ref pointers in %s', parser._basePath);
  crawl(parser.schema, parser._basePath, [], parser.$refs, options);
}

/**
 * Recursively crawls the given value, and dereferences any JSON references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} path - The path to use for resolving relative JSON references
 * @param {object[]} parents - An array of the parent objects that have already been dereferenced
 * @param {$Refs} $refs - The resolved JSON references
 * @param {$RefParserOptions} options
 */
function crawl(obj, path, parents, $refs, options) {
  if (obj && typeof(obj) === 'object') {
    parents.push(obj);
    path = util.path.ensureHash(path);

    Object.keys(obj).forEach(function(key) {
      var keyPath = path + '/' + key;
      var value = obj[key];

      if ($Ref.isAllowed$Ref(value, options)) {
        // We found a $ref, so resolve it
        util.debug('Dereferencing $ref pointer "%s" at %s', value.$ref, keyPath);
        var $refPath = url.resolve(path, value.$ref);
        var pointer = $refs._resolve($refPath, options);

        // Dereference the JSON reference
        obj[key] = value = pointer.value;

        // Crawl the dereferenced value (unless it's circular)
        if (parents.indexOf(value) === -1) {
          crawl(pointer.value, pointer.path, parents, $refs, options);
        }
      }
      else if (parents.indexOf(value) === -1) {
        crawl(value, keyPath, parents, $refs, options);
      }
    });

    parents.pop();
  }
}
