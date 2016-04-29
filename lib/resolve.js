'use strict';

var Promise = require('./util/promise');
var $Ref = require('./ref');
var Pointer = require('./pointer');
var readFile = require('./read-file');
var parseFile = require('./parse-file');
var debug = require('./util/debug');
var URL = require('./util/url');

module.exports = resolve;

/**
 * Resolves JSON References in the JSON Schema. What does it mean to "resolve" JSON References?
 * I'm glad you asked. It just means we download any external files that are referenced in the
 * JSON Schema, and then parse those files. So, when it's all done, you'll have a {@link Schema}
 * object with the parsed contents of all files in the schema (including the main schema file).
 *
 * This method doesn't make any changes to the schema. All of the $ref entries are still there
 * in each file. If you want to replace the $refs with the actual values they point to, then use
 * the {@link $RefParser#dereference} or {@link $RefParser#bundle} methods instead.
 *
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<Schema>}
 * The same {@link Schema} object is returned. Its {@link Schema#files} array will contain
 * {@link File} objects for every file that is referenced in the schema. It will NOT contain
 * duplicates.
 */
function resolve(schema, options) {
  if (!options.resolve.external) {
    // Nothing to resolve, so exit early
    return Promise.resolve(schema);
  }

  var promises;
  try {
    debug('Resolving $ref pointers in %s', schema.rootUrl);
    promises = crawl(schema.root, schema.rootUrl + '#', schema, options);
  }
  catch (e) {
    return Promise.reject(e);
  }

  return Promise.all(promises)
    .then(function() {
      return schema;
    });
}

/**
 * Recursively crawls the given value, and resolves any external JSON references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} url - The full URL of `obj`, including a JSON Pointer in the hash
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 *
 * @returns {Promise[]}
 * Returns an array of promises. There will be one promise for each external JSON Reference
 * in `obj`. If `obj` does not contain any JSON References, then the array will be empty.
 * If any of the JSON References point to files that contain additional JSON References,
 * then the corresponding promise will internally reference another array of promises.
 */
function crawl(obj, url, schema, options) {
  var promises = [];

  if (obj && typeof obj === 'object') {
    if ($Ref.isExternal$Ref(obj)) {
      promises.push(resolve$Ref(obj, url, schema, options));
    }
    else {
      Object.keys(obj).forEach(function(key) {
        var keyUrl = Pointer.join(url, key);
        var value = obj[key];

        if ($Ref.isExternal$Ref(value)) {
          promises.push(resolve$Ref(value, keyUrl, schema, options));
        }
        else {
          promises = promises.concat(crawl(value, keyUrl, schema, options));
        }
      });
    }
  }

  return promises;
}

/**
 * Reads and parses the given JSON Reference, and then crawls the resulting value.
 *
 * @param {{$ref: string}} $ref - The JSON Reference to resolve
 * @param {string} url - The full URL of `$ref`, including a JSON Pointer in the hash
 * @param {schema} schema
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves once all JSON references in the object have been resolved,
 * including nested references that are contained in externally-referenced files.
 */
function resolve$Ref($ref, url, schema, options) {
  debug('Resolving $ref pointer "%s" at %s', $ref.$ref, url);

  // If the $ref is relative, then resolve it against the current resolution path
  var resolvedPath = URL.resolve(url, $ref.$ref);

  if (schema.files.exists(resolvedPath)) {
    // We've already read & parsed this file. No need to do it again.
    return Promise.resolve();
  }

  var file = new File(resolvedPath);
  schema.files.push(file);
  return readFile(file, options)
    .then(function() {
      return parseFile(file, options);
    })
    .then(function() {
      // Crawl the parsed value
      debug('Resolving $ref pointers in %s', file.url);
      var promises = crawl(file.data, file.url + '#', schema, options);
      return Promise.all(promises);
    });
}
