/** !
 * JSON Schema $Ref Parser v4.0.0-beta.0
 *
 * @link https://github.com/BigstickCarpet/json-schema-ref-parser
 * @license MIT
 */
'use strict';

var $Ref = require('./ref');
var Pointer = require('./pointer');
var debug = require('./util/debug');
var URL = require('./url');

module.exports = bundle;

/**
 * Parses a JSON Schema and merges all files into a single one. If the schema contains multiple
 * JSON References that point to the same value, then only ONE of those references will be replaced
 * with the value. The other references will just have their `$ref` path modified to point to the
 * new location of the value.
 *
 * The end result is a JSON Schema that only contains INTERNAL $ref pointers, so there are no longer
 * any references to other files.
 *
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 */
function bundle(schema, options) {
  debug('Bundling $ref pointers in %s', schema.rootUrl);

  // Build an inventory of all $ref pointers in the JSON Schema
  var inventory = crawl(schema, 'root', schema.rootUrl + '#', '#', [], [], schema, options);

  // Remap all $ref pointers
  remap(inventory);

  return schema;
}

/**
 * Recursively crawls the given value, and inventories all JSON references.
 *
 * @param {object} parent - The object containing the value to crawl. If the value is not an object or array, it will be ignored.
 * @param {string} key - The property key of `parent` to be crawled
 * @param {string} url - The full url of the property being crawled, including a JSON Pointer in the hash
 * @param {string} pathFromRoot - The JSON Pointer path of the property being crawled, from the schema root
 * @param {object[]} parents - An array of the parent objects that have already been crawled (used to detect circular references)
 * @param {object[]} inventory - An array of already-inventoried $ref pointers
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 *
 * @returns {object[]} - Returns the populated array of inventoried $ref pointers
 */
function crawl(parent, key, url, pathFromRoot, parents, inventory, schema, options) {
  var obj = key === null ? parent : parent[key];

  if (obj && typeof obj === 'object') {
    parents.push(obj);

    if ($Ref.is$Ref(obj)) {
      inventory$Ref(parent, key, url, pathFromRoot, parents, inventory, schema, options);
    }
    else {
      var keys = Object.keys(obj);

      // Most people will expect references to be bundled into the the "definitions" property,
      // so we always crawl that property first, if it exists.
      var defs = keys.indexOf('definitions');
      if (defs > 0) {
        keys.splice(0, 0, keys.splice(defs, 1)[0]);
      }

      keys.forEach(function(key) {
        var keyPath = Pointer.join(url, key);
        var keyPathFromRoot = Pointer.join(pathFromRoot, key);
        var value = obj[key];

        if ($Ref.is$Ref(value)) {
          inventory$Ref(obj, key, url, keyPathFromRoot, parents, inventory, schema, options);
        }
        else {
          if (parents.indexOf(value) === -1) {
            crawl(obj, key, keyPath, keyPathFromRoot, parents, inventory, schema, options);
          }
          else {
            schema.circular = true;
          }
        }
      });
    }

    parents.pop();
  }

  return inventory;
}

/**
 * Inventories the given JSON Reference.
 * "Inventorying" a JSON Reference consists of gathering detailed information about it so we can
 * optimize all $refs in the schema later.
 *
 * Inventorying is done recursively, so the $ref's resolved value is also inventoried.
 *
 * @param {object} $refParent - The object that contains a JSON Reference as one of its keys
 * @param {string} $refKey - The key in `$refParent` that is a JSON Reference
 * @param {string} url - The full url of the $ref at `$refKey`, including a JSON Pointer in the hash
 * @param {string} pathFromRoot - The JSON Pointer path of the $ref at `$refKey`, from the schema root
 * @param {object[]} parents - An array of the parent objects that have already been crawled (used to detect circular references)
 * @param {object[]} inventory - An array of already-inventoried $ref pointers
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 */
function inventory$Ref($refParent, $refKey, url, pathFromRoot, parents, inventory, schema, options) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].parent === $refParent && inventory[i].key === $refKey) {
      // This $Ref has already been inventoried, so we don't need to process it again
      return;
    }
  }

  var $ref = $refKey === null ? $refParent : $refParent[$refKey];
  var resolvedUrl = URL.resolve(url, $ref.$ref);
  var pointer = Pointer.resolve(resolvedUrl, schema, options);
  var depth = Pointer.parse(pathFromRoot).length;
  var file = URL.stripHash(pointer.url);
  var hash = URL.getHash(pointer.path);
  var external = file !== schema.rootUrl;
  var extended = $Ref.isExtended($ref);

  inventory.push({
    $ref: $ref,                   // The JSON Reference (e.g. {$ref: string})
    parent: $refParent,           // The object that contains this $ref pointer
    key: $refKey,                 // The key in `parent` that is the $ref pointer
    pathFromRoot: pathFromRoot,   // The path to the $ref pointer, from the JSON Schema root
    depth: depth,                 // How far from the JSON Schema root is this $ref pointer?
    file: file,                   // The file that the $ref pointer resolves to
    hash: hash,                   // The hash within `file` that the $ref pointer resolves to
    value: pointer.value,         // The resolved value of the $ref pointer
    circular: pointer.circular,   // Is this $ref pointer DIRECTLY circular? (i.e. it references itself)
    extended: extended,           // Does this $ref extend its resolved value? (i.e. it has extra properties, in addition to "$ref")
    external: external            // Does this $ref pointer point to a file other than the main JSON Schema file?
  });

  // Set the `schema.circular` flag if any circular references are found
  if (pointer.circular || parents.indexOf(pointer.value) !== -1) {
    schema.circular = true;
  }

  // Recursively crawl the resolved value
  crawl(pointer.value, null, pointer.url, pathFromRoot, parents, inventory, schema, options);
}

/**
 * Re-maps every $ref pointer, so that they're all relative to the root of the JSON Schema.
 * Each referenced value is dereferenced EXACTLY ONCE.  All subsequent references to the same
 * value are re-mapped to point to the first reference.
 *
 * @example:
 *  {
 *    first: { $ref: somefile.json#/some/part },
 *    second: { $ref: somefile.json#/another/part },
 *    third: { $ref: somefile.json },
 *    fourth: { $ref: somefile.json#/some/part/sub/part }
 *  }
 *
 * In this example, there are four references to the same file, but since the third reference points
 * to the ENTIRE file, that's the only one we need to dereference.  The other three can just be
 * remapped to point inside the third one.
 *
 * On the other hand, if the third reference DIDN'T exist, then the first and second would both need
 * to be dereferenced, since they point to different parts of the file. The fourth reference does NOT
 * need to be dereferenced, because it can be remapped to point inside the first one.
 *
 * @param {object[]} inventory
 */
function remap(inventory) {
  // Group & sort all the $ref pointers, so they're in the order that we need to dereference/remap them
  inventory.sort(function(a, b) {
    if (a.file !== b.file) {
      return a.file < b.file ? -1 : +1;   // Group all the $refs that point to the same file
    }
    else if (a.hash !== b.hash) {
      return a.hash < b.hash ? -1 : +1;   // Group all the $refs that point to the same part of the file
    }
    else if (a.circular !== b.circular) {
      return a.circular ? -1 : +1;        // If the $ref points to itself, then sort it higher than other $refs that point to this $ref
    }
    else if (a.extended !== b.extended) {
      return a.extended ? +1 : -1;        // If the $ref extends the resolved value, then sort it lower than other $refs that don't extend the value
    }
    else if (a.depth !== b.depth) {
      return a.depth - b.depth;           // Sort $refs by how close they are to the JSON Schema root
    }
    else {
      // If all else is equal, use the $ref that's in the "definitions" property
      return b.pathFromRoot.lastIndexOf('/definitions') - a.pathFromRoot.lastIndexOf('/definitions');
    }
  });

  var file, hash, pathFromRoot;
  inventory.forEach(function(i) {
    debug('Re-mapping $ref pointer "%s" at %s', i.$ref.$ref, i.pathFromRoot);

    if (!i.external) {
      // This $ref already resolves to the main JSON Schema file
      i.$ref.$ref = i.hash;
    }
    else if (i.file === file && i.hash === hash) {
      // This $ref points to the same value as the prevous $ref, so remap it to the same path
      i.$ref.$ref = pathFromRoot;
    }
    else if (i.file === file && i.hash.indexOf(hash + '/') === 0) {
      // This $ref points to the a sub-value as the prevous $ref, so remap it beneath that path
      i.$ref.$ref = Pointer.join(pathFromRoot, Pointer.parse(i.hash));
    }
    else {
      // We've moved to a new file or new hash
      file = i.file;
      hash = i.hash;
      pathFromRoot = i.pathFromRoot;

      // This is the first $ref to point to this value, so dereference the value.
      // Any other $refs that point to the same value will point to this $ref instead
      i.$ref = i.parent[i.key] = $Ref.dereference(i.$ref, i.value);

      if (i.circular) {
        // This $ref points to itself
        i.$ref.$ref = i.pathFromRoot;
      }
    }

    debug('    new value: %s', (i.$ref && i.$ref.$ref) ? i.$ref.$ref : '[object Object]');
  });
}
