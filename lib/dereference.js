'use strict';

var $Ref    = require('./ref'),
    Pointer = require('./pointer'),
    util    = require('./util'),
    ono     = require('ono'),
    url     = require('url');

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
  parser.$refs.circular = false;
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

    Object.keys(obj).forEach(function(key) {
      var keyPath = Pointer.join(path, key);
      var value = obj[key];

      if ($Ref.isAllowed$Ref(value, options)) {
        // We found a $ref, so resolve it
        util.debug('Dereferencing $ref pointer "%s" at %s', value.$ref, keyPath);
        var $refPath = url.resolve(path, value.$ref);
        var pointer = $refs._resolve($refPath, options);

        // Check for circular references
        var circular = pointer.circular || parents.indexOf(pointer.value) !== -1;
        $refs.circular = $refs.circular || true;
        if (!options.allow.circular) {
          throw ono.reference('Circular $ref pointer found at %s', keyPath);
        }

        // Dereference the JSON reference
        value = dereference$Ref(obj, key, pointer.value);

        // Crawl the dereferenced value (unless it's circular)
        if (!circular) {
          crawl(value, pointer.path, parents, $refs, options);
        }
      }
      else if (parents.indexOf(value) === -1) {
        crawl(value, keyPath, parents, $refs, options);
      }
    });

    parents.pop();
  }
}

/**
 * Replaces the specified JSON reference with its resolved value.
 *
 * @param {object} obj - The object that contains the JSON reference
 * @param {string} key - The key of the JSON reference within `obj`
 * @param {*} value - The resolved value
 * @returns {*} - Returns the new value of the JSON reference
 */
function dereference$Ref(obj, key, value) {
  var $refObj = obj[key];

  if (value && typeof(value) === 'object' && Object.keys($refObj).length > 1) {
    // The JSON reference has additional properties (other than "$ref"),
    // so merge the resolved value rather than completely replacing the reference
    delete $refObj.$ref;
    Object.keys(value).forEach(function(key) {
      if (!(key in $refObj)) {
        $refObj[key] = value[key];
      }
    });
  }
  else {
    // Completely replace the original reference with the resolved value
    return obj[key] = value;
  }
}
