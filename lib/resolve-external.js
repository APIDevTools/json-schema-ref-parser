"use strict";

const $Ref = require("./ref");
const Pointer = require("./pointer");
const parse = require("./parse");
const url = require("./util/url");
const { isHandledError } = require("./util/errors");
const _ = require('lodash');
module.exports = resolveExternal;

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
function resolveExternal (parser, options) {
  if (!options.resolve.external) {
    // Nothing to resolve, so exit early
    return Promise.resolve();
  }

  try {
    // console.log('Resolving $ref pointers in %s', parser.$refs._root$Ref.path);
    let promises = crawl(parser.schema, parser.$refs._root$Ref.path + "#", parser.$refs, options);
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
 * @param {Set} seen - Internal.
 *
 * @returns {Promise[]}
 * Returns an array of promises. There will be one promise for each JSON reference in `obj`.
 * If `obj` does not contain any JSON references, then the array will be empty.
 * If any of the JSON references point to files that contain additional JSON references,
 * then the corresponding promise will internally reference an array of promises.
 */
function crawl (obj, path, $refs, options, seen) {
  seen = seen || new Set();
  let promises = [];

  if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !seen.has(obj)) {
    seen.add(obj); // Track previously seen objects to avoid infinite recursion
    if ($Ref.isExternal$Ref(obj)) {
      promises.push(resolve$Ref(obj, path, $refs, options));
    }
    else {
      for (let key of Object.keys(obj)) {
        let keyPath = Pointer.join(path, key);
        let value = obj[key];

        if ($Ref.isExternal$Ref(value)) { 
          if(Object.keys(value).length > 1) {
            promises.push(resolveAndMerge$Ref(value, keyPath, $refs, options, seen));
          }
          else {
            promises.push(resolve$Ref(value, keyPath, $refs, options));
          }
        }
        else {
          promises = promises.concat(crawl(value, keyPath, $refs, options, seen));
        }
      }
    }
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

 function assignPropertyAt( object, propertyToAssign, jsonPath ) {
  let parts = jsonPath.split( "." ),
    length = parts.length,
    i,
    property = object || this;

  for ( i = 0; i < length; i++ ) {
    property = property[parts[i]];
  }

  Object.assign(property, propertyToAssign);
 }

 /**
  * If object does not use Dates, functions, undefined, Infinity, RegExps, Maps, Sets, Blobs,
  * FileLists, ImageDatas, sparse Arrays, Typed Arrays or other complex types within object than
  * a deep clone of the input object will be returned.
  * 
  * @param {Object} obj 
  * @returns {Object}
  * Deep copy of the input object
  */
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Returns JSON path in dot notation
 * 
 * @param {hashedPath: string} hashedPath 
 * @returns {jsonPath: string} 
 */
function hashedPathToJsonPath(hashedPath) {
  let hashIndex = hashedPath.indexOf("#");
  let jsonPath; 
  if (hashIndex >= 0) {
    jsonPath = hashedPath.substr(hashIndex+2, hashedPath.length);
    jsonPath = jsonPath.replace(/\//g, '.');
  }

  return jsonPath;
}

/**
 * Customizer which concats arrays during merge
 * 
 * @param {Object} objValue 
 * @param {Object} srcValue 
 * @returns
 * Concatanated arrays 
 */
 function concatArray(objValue, srcValue) {
  if (_.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}

function remove$RefFromObject(obj) {
  
}

async function resolveAndMerge$Ref ($ref, path, $refs, options, seen) {
  let resolvedPath = url.resolve(path, $ref.$ref);
  let withoutHash = url.stripHash(resolvedPath);

  // Do we already have this $ref?
  const knownRef = $refs._$refs[withoutHash];
  if (knownRef) {
    // We've already parsed this $ref, so use the existing value
    return Promise.resolve($ref.value);
  }

  // Parse the $referenced file/url
  try {
    const parsedRef = await parse(resolvedPath, $refs, options);

    // Deep copy of parsed reference
    const parsedRefCopy = deepCopy(parsedRef);

    // Deep copy the $ref
    const $refCopy = deepCopy($ref);
    
    // Get rid of $ref part.
    // Leave only the part which should be merged.
    delete $refCopy.$ref;

    const jsonPath = hashedPathToJsonPath(resolvedPath);
    
    // Assign the part which should be marged in the right place
    assignPropertyAt(parsedRefCopy, $refCopy, jsonPath);

    // Deep merge parsed reference with the merged copy by concatinating arrays if they occur
    const parsedMergedRef = _.mergeWith(parsedRef, parsedRefCopy, concatArray);

    // Delete all keys except $ref from $ref as they are aleady merged inside parsedMergeRef
    for (let key of Object.keys($ref)) {
      if (key != '$ref') {
        delete $ref[key];
      }
    }

    // Crawl the parsed value
    let promises = crawl(parsedMergedRef, withoutHash + "#", $refs, options, seen);

    return Promise.all(promises);
  }
  catch (err) {
    if (!options.continueOnError || !isHandledError(err)) {
      throw err;
    }

    if ($refs._$refs[withoutHash]) {
      err.source = url.stripHash(path);
      err.path = url.safePointerToPath(url.getHash(path));
    }

    return [];
  }
}
async function resolve$Ref ($ref, path, $refs, options) {
  // console.log('Resolving $ref pointer "%s" at %s', $ref.$ref, path);

  let resolvedPath = url.resolve(path, $ref.$ref);
  let withoutHash = url.stripHash(resolvedPath);

  // Do we already have this $ref?
  let knownRef = $refs._$refs[withoutHash];
  if (knownRef) {
    // We've already parsed this $ref, so use the existing value
    return Promise.resolve($ref.value);
  }

  // Parse the $referenced file/url
  try {
    const result = await parse(resolvedPath, $refs, options);
    // Crawl the parsed value
    // console.log('Resolving $ref pointers in %s', withoutHash);
    let promises = crawl(result, withoutHash + "#", $refs, options);

    return Promise.all(promises);
  }
  catch (err) {
    if (!options.continueOnError || !isHandledError(err)) {
      throw err;
    }

    if ($refs._$refs[withoutHash]) {
      err.source = url.stripHash(path);
      err.path = url.safePointerToPath(url.getHash(path));
    }

    return [];
  }
}
