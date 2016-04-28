'use strict';

var $Ref = require('./ref');
var Pointer = require('./pointer');
var ono = require('ono');
var debug = require('./util/debug');
var URL = require('./util/url');

module.exports = dereference;

/**
 * Parses a JSON Schema and merges all files into a single one, without any JSON References.
 * Every JSON Reference in the schema will be replaced with the value that it points to.
 * If multiple JSON References point to the same object, then they will all be replaced with the
 * same object instance, so reference equality will be maintained.
 *
 * The end result is a JSON Schema without ANY `$ref` pointers, which means it's just a plain-old
 * JavaScript object, and you don't need any JSON Schema libraries (like this one) to work with it
 * after that.
 *
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<Schema>}
 * The same {@link Schema} object is returned. The {@link File#dereferenced} property of all
 * files will be true.
 */
function dereference(schema, options) {
  debug('Dereferencing $ref pointers in %s', parser.$refs._root$Ref.url);
  var dereferenced = crawl(parser.schema, parser.$refs._root$Ref.url, '#', [], parser.$refs, options);
  parser.$refs.circular = dereferenced.circular;
  parser.schema = dereferenced.value;
}

/**
 * Recursively crawls the given value, and dereferences any JSON references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} url - The full url of `obj`, possibly with a JSON Pointer in the hash
 * @param {string} pathFromRoot - The JSON Pointer path of `obj` from the schema root
 * @param {object[]} parents - An array of the parent objects that have already been dereferenced
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 * @returns {{value: object, circular: boolean}}
 */
function crawl(obj, url, pathFromRoot, parents, $refs, options) {
  var dereferenced;
  var result = {
    value: obj,
    circular: false
  };

  if (obj && typeof obj === 'object') {
    parents.push(obj);

    if ($Ref.isAllowed$Ref(obj, options)) {
      dereferenced = dereference$Ref(obj, url, pathFromRoot, parents, $refs, options);
      result.circular = dereferenced.circular;
      result.value = dereferenced.value;
    }
    else {
      Object.keys(obj).forEach(function(key) {
        var keyPath = Pointer.join(url, key);
        var keyPathFromRoot = Pointer.join(pathFromRoot, key);
        var value = obj[key];
        var circular = false;

        if ($Ref.isAllowed$Ref(value, options)) {
          dereferenced = dereference$Ref(value, keyPath, keyPathFromRoot, parents, $refs, options);
          circular = dereferenced.circular;
          obj[key] = dereferenced.value;
        }
        else {
          if (parents.indexOf(value) === -1) {
            dereferenced = crawl(value, keyPath, keyPathFromRoot, parents, $refs, options);
            circular = dereferenced.circular;
            obj[key] = dereferenced.value;
          }
          else {
            circular = foundCircularReference(keyPath, $refs, options);
          }
        }

        // Set the "isCircular" flag if this or any other property is circular
        result.circular = result.circular || circular;
      });
    }

    parents.pop();
  }

  return result;
}

/**
 * Dereferences the given JSON Reference, and then crawls the resulting value.
 *
 * @param {{$ref: string}} $ref - The JSON Reference to resolve
 * @param {string} url - The full URL of `$ref`, possibly with a JSON Pointer in the hash
 * @param {string} pathFromRoot - The JSON Pointer path of `$ref` from the schema root
 * @param {object[]} parents - An array of the parent objects that have already been dereferenced
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 * @returns {{value: object, circular: boolean}}
 */
function dereference$Ref($ref, url, pathFromRoot, parents, $refs, options) {
  debug('Dereferencing $ref pointer "%s" at %s', $ref.$ref, url);

  var $refPath = URL.resolve(url, $ref.$ref);
  var pointer = $refs._resolve($refPath, options);

  // Check for circular references
  var directCircular = pointer.circular;
  var circular = directCircular || parents.indexOf(pointer.value) !== -1;
  circular && foundCircularReference(url, $refs, options);

  // Dereference the JSON reference
  var dereferencedValue = $Ref.dereference($ref, pointer.value);

  // Crawl the dereferenced value (unless it's circular)
  if (!circular) {
    // Determine if the dereferenced value is circular
    var dereferenced = crawl(dereferencedValue, pointer.url, pathFromRoot, parents, $refs, options);
    circular = dereferenced.circular;
    dereferencedValue = dereferenced.value;
  }

  if (circular && !directCircular && options.dereference.circular === 'ignore') {
    // The user has chosen to "ignore" circular references, so don't change the value
    dereferencedValue = $ref;
  }

  if (directCircular) {
    // The pointer is a DIRECT circular reference (i.e. it references itself).
    // So replace the $ref with the JSON Pointer path from the schema root
    dereferencedValue.$ref = pathFromRoot;
  }

  return {
    circular: circular,
    value: dereferencedValue
  };
}

/**
 * Called when a circular reference is found.
 * It sets the {@link $Refs#circular} flag, and throws an error if options.dereference.circular is false.
 *
 * @param {string} url - The full URL of the circular reference, including the JSON Pointer in the hash
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 * @returns {boolean} - always returns true, to indicate that a circular reference was found
 */
function foundCircularReference(url, $refs, options) {
  $refs.circular = true;
  if (!options.dereference.circular) {
    throw ono.reference('Circular $ref pointer found at %s', url);
  }
  return true;
}
