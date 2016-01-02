'use strict';

var Promise = require('./promise'),
    $Ref    = require('./ref'),
    Pointer = require('./pointer'),
    read    = require('./read'),
    util    = require('./util'),
    url     = require('url');

module.exports = resolve;

/**
 * Crawls the JSON schema, finds all external JSON references, and resolves their values.
 * This method does not mutate the JSON schema. The resolved values are added to {@link $RefParser#$refs}.
 *
 * NOTE: We only care about EXTERNAL references here. INTERNAL references are only relevant when dereferencing.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves once all JSON references in the schema have been resolved,
 * including nested references that are contained in externally-referenced files.
 */
function resolve(parser, options) {
  try {
    if (!options.$refs.external) {
      // Nothing to resolve, so exit early
      return Promise.resolve();
    }

    util.debug('Resolving $ref pointers in %s', parser.$refs._basePath);
    var promises = crawl(parser.schema, parser.$refs._basePath + '#', parser.$refs, options);
    return Promise.all(promises);
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Recursively crawls the given value, and resolves any external JSON references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} path - The full path of `obj`, possibly with a JSON Pointer in the hash
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 *
 * @returns {Promise[]}
 * Returns an array of promises. There will be one promise for each JSON reference in `obj`.
 * If `obj` does not contain any JSON references, then the array will be empty.
 * If any of the JSON references point to files that contain additional JSON references,
 * then the corresponding promise will internally reference an array of promises.
 */
function crawl(obj, path, $refs, options) {
  var promises = [];

  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(function(key) {
      var keyPath = Pointer.join(path, key);
      var value = obj[key];

      if ($Ref.isExternal$Ref(value)) {
        var promise = resolve$Ref(value, keyPath, $refs, options);
        promises.push(promise);
      }
      else {
        promises = promises.concat(crawl(value, keyPath, $refs, options));
      }
    });
  }
  return promises;
}

/**
 * Resolves the given JSON Reference, and then crawls the resulting value.
 *
 * @param {{$ref: string}} $ref - The JSON Reference to resolve
 * @param {string} path - The full path of `$ref`, possibly with a JSON Pointer in the hash
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves once all JSON references in the object have been resolved,
 * including nested references that are contained in externally-referenced files.
 */
function resolve$Ref($ref, path, $refs, options) {
  util.debug('Resolving $ref pointer "%s" at %s', $ref.$ref, path);
  var resolvedPath = url.resolve(path, $ref.$ref);

  return read(resolvedPath, $refs, options)
    .then(function(result) {
      // If the result was already cached, then we DON'T need to crawl it
      if (!result.cached) {
        // Crawl the new $ref
        util.debug('Resolving $ref pointers in %s', result.$ref.path);
        var promises = crawl(result.$ref.value, result.$ref.path + '#', $refs, options);
        return Promise.all(promises);
      }
    });
}
