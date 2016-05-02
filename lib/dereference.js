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
 * @returns {Schema}
 * The same {@link Schema} object is returned. The {@link File#data} property of the root file is
 * set to the fully-dereferenced schema. If any circular references were found, then the
 * {@link Schema#circular} flag is set. The {@link File#dereferenced} property of all files are
 * set to true.
 */
function dereference(schema, options) {
  debug('Dereferencing $ref pointers in %s', schema.rootUrl);
  var dereferenced = crawl(schema.root, schema.rootUrl, '#', [], schema, options);

  // Flag the schema as circular if any circular $refs were found
  schema.circular = dereferenced.circular;

  // Replace the schema.root with the fully-dereferenced JSON Schema
  schema.files[0].data = dereferenced.value;

  // Set the file.dereferenced flag of all files, to indicate that their
  // file.data properties have been dereferenced
  for (var i = 0; i < schema.files.length; i++) {
    schema.files[i].dereferenced = true;
  }

  return schema;
}

/**
 * Recursively crawls the given value, and dereferences any JSON References.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} url - The full url of `obj`, including a JSON Pointer in the hash
 * @param {string} pathFromRoot - The JSON Pointer path of `obj` from the schema root
 * @param {object[]} parents - An array of the parent objects that have already been dereferenced
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 * @returns {{value: object, circular: boolean}}
 */
function crawl(obj, url, pathFromRoot, parents, schema, options) {
  var dereferenced;
  var result = {
    value: obj,
    circular: false
  };

  if (obj && typeof obj === 'object') {
    parents.push(obj);

    if ($Ref.isAllowed(obj, options)) {
      dereferenced = dereference$Ref(obj, url, pathFromRoot, parents, schema, options);
      result.circular = dereferenced.circular;
      result.value = dereferenced.value;
    }
    else {
      Object.keys(obj).forEach(function(key) {
        var keyPath = Pointer.join(url, key);
        var keyPathFromRoot = Pointer.join(pathFromRoot, key);
        var value = obj[key];
        var circular = false;

        if ($Ref.isAllowed(value, options)) {
          dereferenced = dereference$Ref(value, keyPath, keyPathFromRoot, parents, schema, options);
          circular = dereferenced.circular;
          obj[key] = dereferenced.value;
        }
        else {
          if (parents.indexOf(value) === -1) {
            dereferenced = crawl(value, keyPath, keyPathFromRoot, parents, schema, options);
            circular = dereferenced.circular;
            obj[key] = dereferenced.value;
          }
          else {
            circular = foundCircularReference(keyPath, schema, options);
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
 * @param {string} url - The full URL of `$ref`, including a JSON Pointer in the hash
 * @param {string} pathFromRoot - The JSON Pointer path of `$ref` from the schema root
 * @param {object[]} parents - An array of the parent objects that have already been dereferenced
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 * @returns {{value: object, circular: boolean}}
 */
function dereference$Ref($ref, url, pathFromRoot, parents, schema, options) {
  debug('Dereferencing $ref pointer "%s" at %s', $ref.$ref, url);

  var resolvedUrl = URL.resolve(url, $ref.$ref);
  var pointer = Pointer.resolve(resolvedUrl, schema, options);

  // Check for circular references
  var directCircular = pointer.circular;
  var circular = directCircular || parents.indexOf(pointer.value) !== -1;
  circular && foundCircularReference(url, schema, options);

  // Dereference the JSON reference
  var dereferencedValue = $Ref.dereference($ref, pointer.value);

  // Crawl the dereferenced value (unless it's circular)
  if (!circular) {
    // Determine if the dereferenced value is circular
    var dereferenced = crawl(dereferencedValue, pointer.url, pathFromRoot, parents, schema, options);
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
 * @param {string} url - The full URL of the circular reference, including a JSON Pointer in the hash
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 * @returns {boolean} - always returns true, to indicate that a circular reference was found
 */
function foundCircularReference(url, schema, options) {
  schema.circular = true;
  if (!options.dereference.circular) {
    throw ono.reference('Circular $ref pointer found at %s', url);
  }
  return true;
}
