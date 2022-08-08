"use strict";

const $Ref = require("./ref");
const Pointer = require("./pointer");
const { ono } = require("@jsdevtools/ono");
const url = require("./util/url");

module.exports = dereference;

/**
 * Crawls the JSON schema, finds all JSON references, and dereferences them.
 * This method mutates the JSON schema object, replacing JSON references with their resolved value.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 */
function dereference (parser, options) {
  // console.log('Dereferencing $ref pointers in %s', parser.$refs._root$Ref.path);
  const result = crawl(parser.schema, parser.$refs._root$Ref.path, "#", new Set(), [], new Map(), parser.$refs, options);
  parser.schema = result.value;
}

const mergeRefObject = (refObject, newObject) => {
  const refKeys = Object.keys(refObject);
  const extraKeys = {};
  if (refKeys.length > 1) {
    for (let key of refKeys) {
      if (key !== "$ref" && !(key in newObject)) {
        extraKeys[key] = refObject[key];
      }
    }
    return Object.assign({}, newObject, extraKeys);
  }
  return newObject;
};

/**
 * Recursively crawls the given value, and dereferences any JSON references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} path - The full path of `obj`, possibly with a JSON Pointer in the hash
 * @param {string} pathFromRoot - The path of `obj` from the schema root
 * @param {Set<object>} parents - An array of the parent objects that have already been dereferenced
 * @param {array<string>} pathList - An array of the list of parents reference points for error handling
 * @param {Map<string,object>} dereferencedCache - An map of all the dereferenced objects
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 * @returns {object}
 */
function crawl (obj, path, pathFromRoot, parents, pathList, dereferencedCache, $refs, options) {
  if (!obj || Array.isArray(obj) || typeof obj !== "object" || ArrayBuffer.isView(obj) || options.dereference.excludedPathMatcher(pathFromRoot)) {
    return { value: obj, circular: false };
  }

  if (parents.has(obj)) {
    foundCircularReference(pathList.pop(), $refs, options);
    return { value: obj, circular: true };
  }

  if ($Ref.isAllowed$Ref(obj, options)) {
    const $refObject = obj;
    let $refPath = url.resolve(path, $refObject.$ref);

    const cachedPathFromRoot = dereferencedCache.get($refPath);

    const pointer = $refs._resolve($refPath, path, options);
    if (!pointer) {
      return { value: null };
    }

    // Dereference the JSON reference
    let dereferencedValue = mergeRefObject($refObject, $Ref.dereference($refObject, pointer.value));

    if (pointer.circular) {
      // The pointer is a DIRECT circular reference (i.e. it references itself).
      // So replace the $ref path with the absolute path from the JSON Schema root
      dereferencedValue.$ref = pathFromRoot;

      foundCircularReference(path, $refs, options);
      return { value: dereferencedValue, circular: true };
    }


    // only cache if no extra properties than $ref
    if (Object.keys($refObject).length === 1) {
      dereferencedCache.set($refPath, pathFromRoot);
    }

    const result = crawl(dereferencedValue, pointer.path, pathFromRoot, new Set(parents).add(obj), pathList.concat(path), dereferencedCache, $refs, options);
    if (result.circular && options.dereference.circular === "ignore") {
      return {
        circular: false,
        value: {
          ...$refObject,
          $circularRef: cachedPathFromRoot || $refObject.$ref
        }
      };
    }
    return result;
  }

  let circular;
  for (const key of Object.keys(obj)) {
    let keyPath = Pointer.join(path, key);
    let keyPathFromRoot = Pointer.join(pathFromRoot, key);

    const result = crawl(obj[key], keyPath, keyPathFromRoot, new Set(parents).add(obj), pathList.concat(path), dereferencedCache, $refs, options);
    circular = circular || result.circular;
    obj[key] = result.value;
  }
  return { value: obj, circular };
}

/**
 * Called when a circular reference is found.
 * It sets the {@link $Refs#circular} flag, and throws an error if options.dereference.circular is false.
 *
 * @param {string} keyPath - The JSON Reference path of the circular reference
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 * @returns {boolean} - always returns true, to indicate that a circular reference was found
 */
function foundCircularReference (keyPath, $refs, options) {
  $refs.circular = true;
  if (!options.dereference.circular) {
    throw ono.reference(`Circular $ref pointer found at ${keyPath}`);
  }
  return true;
}
