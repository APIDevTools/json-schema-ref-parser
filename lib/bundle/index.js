"use strict";

const $Ref = require("../ref");
const Pointer = require("../pointer");
const url = require("../util/url");
const { safePathToPointer, safePointerToPath } = require("../util/url");
const { get, set } = require("./util/object");

module.exports = bundle;

/**
 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
 * only has *internal* references, not any *external* references.
 * This method mutates the JSON schema object, adding new references and re-mapping existing ones.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 */
function bundle (parser, options) {
  parser.$refs.propertyMap = {}; // we assign a new object prior to another bundle process
  // console.log('Bundling $ref pointers in %s', parser.$refs._root$Ref.path);

  // Build an inventory of all $ref pointers in the JSON Schema
  let inventory = [];
  let customRoots = {};

  crawl(parser, "schema", parser.$refs._root$Ref.path + "#", "#", 0, inventory, parser.$refs, options, customRoots);

  // Remap all $ref pointers
  remap(parser.schema, inventory, parser.$refs, options, customRoots);
}

/**
 * Recursively crawls the given value, and inventories all JSON references.

 * @param {object} parent - The object containing the value to crawl. If the value is not an object or array, it will be ignored.
 * @param {string|null} key - The property key of `parent` to be crawled
 * @param {string} path - The full path of the property being crawled, possibly with a JSON Pointer in the hash
 * @param {string} pathFromRoot - The path of the property being crawled, from the schema root
 * @param {number} indirections
 * @param {object[]} inventory - An array of already-inventoried $ref pointers
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 * @param {object} customRoots
 */
function crawl (parent, key, path, pathFromRoot, indirections, inventory, $refs, options, customRoots) {
  let obj = key === null ? parent : parent[key];

  if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj)) {
    if ($Ref.isAllowed$Ref(obj)) {
      inventory$Ref(parent, key, path, pathFromRoot, indirections, inventory, $refs, options, customRoots);
    }
    else {
      // Crawl the object in a specific order that's optimized for bundling.
      // This is important because it determines how `pathFromRoot` gets built,
      // which later determines which keys get dereferenced and which ones get remapped
      let keys = Object.keys(obj)
        .sort((a, b) => {
          let aDefinitionsIndex = `${pathFromRoot}/${a}`.lastIndexOf(options.bundle.defaultRoot);
          let bDefinitionsIndex = `${pathFromRoot}/${b}`.lastIndexOf(options.bundle.defaultRoot);
          // Most people will expect references to be bundled into the the defaultRoot property,
          // so we always crawl that property first, if it exists.

          if (aDefinitionsIndex !== bDefinitionsIndex) {
            // Give higher priority to the $ref that's closer to the "definitions" property
            return bDefinitionsIndex - aDefinitionsIndex;
          }
          else {
            // Otherwise, crawl the keys based on their length.
            // This produces the shortest possible bundled references
            return a.length - b.length;
          }
        });

      // eslint-disable-next-line no-shadow
      for (let key of keys) {
        let keyPath = Pointer.join(path, key);
        let keyPathFromRoot = Pointer.join(pathFromRoot, key);
        let value = obj[key];

        if ($Ref.isAllowed$Ref(value)) {
          inventory$Ref(obj, key, path, keyPathFromRoot, indirections, inventory, $refs, options, customRoots);
        }
        else {
          crawl(obj, key, keyPath, keyPathFromRoot, indirections, inventory, $refs, options, customRoots);
        }
      }
    }
  }
}

function findClosestRoot (roots, hash, pathFromRoot) {
  let keys = Object.keys(roots);
  if (keys.length === 0 || roots["#"] === null) {
    return pathFromRoot;
  }

  keys = keys.filter(key => roots[key] !== null);
  keys.sort((a, b) => b.length - a.length);
  let customRoot = keys.find(root => hash.startsWith(root));

  if (customRoot === undefined) {
    return pathFromRoot;
  }

  return roots[customRoot] + hash.replace(customRoot, "");
}

/**
 * Inventories the given JSON Reference (i.e. records detailed information about it so we can
 * optimize all $refs in the schema), and then crawls the resolved value.
 *
 * @param {object} $refParent - The object that contains a JSON Reference as one of its keys
 * @param {string|null} $refKey - The key in `$refParent` that is a JSON Reference
 * @param {string} path - The full path of the JSON Reference at `$refKey`, possibly with a JSON Pointer in the hash
 * @param {string} pathFromRoot - The path of the JSON Reference at `$refKey`, from the schema root
 * @param {number} indirections
 * @param {object[]} inventory - An array of already-inventoried $ref pointers
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 * @param {object} customRoots
 */
function inventory$Ref ($refParent, $refKey, path, pathFromRoot, indirections, inventory, $refs, options, customRoots) {
  let $ref = $refKey === null ? $refParent : $refParent[$refKey];
  let $refPath = url.resolve(path, $ref.$ref);
  let pointer = $refs._resolve($refPath, pathFromRoot, options);
  if (pointer === null) {
    return;
  }

  let depth = Pointer.parse(pathFromRoot).length;
  let file = url.stripHash(pointer.path);
  let hash = url.getHash(pointer.path);
  let external = file !== $refs._root$Ref.path;
  let extended = $Ref.isExtended$Ref($ref);
  indirections += pointer.indirections;

  let mappedPathFromRoot = pathFromRoot;

  let existingEntry = findInInventory(inventory, $refParent, $refKey);
  if (existingEntry) {
    // This $Ref has already been inventoried, so we don't need to process it again
    if (depth < existingEntry.depth || indirections < existingEntry.indirections) {
      removeFromInventory(inventory, existingEntry);
    }
    else {
      return;
    }
  }

  if (options.bundle.generateKey && file !== $refs._root$Ref.path && !(path.indexOf($refs._root$Ref.path) === 0 && $ref.$ref.indexOf("#/") === 0)) {
    if (!customRoots[file]) {
      customRoots[file] = {};
    }

    if (!(hash in customRoots[file])) {
      customRoots[file][hash] = options.bundle.generateKey($refs._root$Ref.value, file, hash, pathFromRoot);
    }

    mappedPathFromRoot = findClosestRoot(customRoots[file], hash, pathFromRoot);
  }

  inventory.push({
    $ref,                   // The JSON Reference (e.g. {$ref: string})
    parent: $refParent,           // The object that contains this $ref pointer
    key: $refKey,                 // The key in `parent` that is the $ref pointer
    pathFromRoot,   // The path to the $ref pointer, from the JSON Schema root
    mappedPathFromRoot, // The path to the $ref pointer after custom root applied
    depth,                 // How far from the JSON Schema root is this $ref pointer?
    file,                   // The file that the $ref pointer resolves to
    hash,                   // The hash within `file` that the $ref pointer resolves to
    value: pointer.value,         // The resolved value of the $ref pointer
    circular: pointer.circular,   // Is this $ref pointer DIRECTLY circular? (i.e. it references itself)
    extended,           // Does this $ref extend its resolved value? (i.e. it has extra properties, in addition to "$ref")
    external,           // Does this $ref pointer point to a file other than the main JSON Schema file?
    indirections,   // The number of indirect references that were traversed to resolve the value
  });

  // Recursively crawl the resolved value
  if (!existingEntry) {
    crawl(pointer.value, null, pointer.path, pathFromRoot, indirections + 1, inventory, $refs, options, customRoots);
  }
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
 * @param {object} schema
 * @param {object[]} inventory
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 * @param {object} customRoots
 */
function remap (schema, inventory, $refs, options, customRoots) {
  // Group & sort all the $ref pointers, so they're in the order that we need to dereference/remap them
  inventory.sort((a, b) => {
    if (a.file !== b.file) {
      // Group all the $refs that point to the same file
      return a.file < b.file ? -1 : +1;
    }
    else if (a.hash !== b.hash) {
      // Group all the $refs that point to the same part of the file
      return a.hash < b.hash ? -1 : +1;
    }
    else if (a.circular !== b.circular) {
      // If the $ref points to itself, then sort it higher than other $refs that point to this $ref
      return a.circular ? -1 : +1;
    }
    else if (a.extended !== b.extended) {
      // If the $ref extends the resolved value, then sort it lower than other $refs that don't extend the value
      return a.extended ? +1 : -1;
    }
    else if (a.indirections !== b.indirections) {
      // Sort direct references higher than indirect references
      return a.indirections - b.indirections;
    }
    else if (a.depth !== b.depth) {
      // Sort $refs by how close they are to the JSON Schema root
      return a.depth - b.depth;
    }
    else {
      // Determine how far each $ref is from the "definitions" property.
      // Most people will expect references to be bundled into the the "definitions" property if possible.
      let aDefinitionsIndex = a.pathFromRoot.lastIndexOf(options.bundle.defaultRoot);
      let bDefinitionsIndex = b.pathFromRoot.lastIndexOf(options.bundle.defaultRoot);

      if (aDefinitionsIndex !== bDefinitionsIndex) {
        // Give higher priority to the $ref that's closer to the "definitions" property
        return bDefinitionsIndex - aDefinitionsIndex;
      }
      else {
        // All else is equal, so use the shorter path, which will produce the shortest possible reference
        return a.pathFromRoot.length - b.pathFromRoot.length;
      }
    }
  });

  let file, hash, pathFromRoot;
  for (let entry of inventory) {
    // console.log('Re-mapping $ref pointer "%s" at %s', entry.$ref.$ref, entry.pathFromRoot);
    // if entry is not dinlineable and has a custom root linked, we need to remap the properties of the object
    if (customRoots[entry.file] && customRoots[entry.file][entry.hash] !== null) {
      if (entry.hash === "#" || !("#" in customRoots[entry.file])) {
        // the whole file is referenced for the first time
        // we need to inject its entire content here
        // or only certain fragment of the whole file has a custom root and we need to inject that portion
        set(schema, customRoots[entry.file][entry.hash], $Ref.dereference(entry.$ref, entry.value));
        entry.$ref.$ref = customRoots[entry.file][entry.hash];
      }
      // entry is not supposed to be moved anywhere, it's not placed under root
      else {
        // a portion of previously referenced (and injected) file is referenced
        // we may need to hoist some of its properties, i.e. `external-file.json#/definitions/foo/definitions/bar` gets remapped to `#/definitions/foo_bar`
        let subschema = get(schema, customRoots[entry.file]["#"]);
        // subschema = contents of the whole file that's inserted at line 264
        let parsedHash = safePointerToPath(entry.hash);
        // value = in fact we do `get(value, ['definitions', 'foo', 'definitions']);` // it's a bit noisy cause we want to handle a potential edge case here
        let value = get(subschema, safePathToPointer(parsedHash.length === 1 ? parsedHash : parsedHash.slice(0, parsedHash.length - 1)));
        // we set the value at relevant spot - this is the first step of the move operation
        // for our scenario, it'd look as follows `set(schema, ['definitions', 'foo_bar'], value['bar']);`
        set(schema, customRoots[entry.file][entry.hash], parsedHash.length === 1 ? value : value[parsedHash[parsedHash.length - 1]]);
        // we delete the old value - the last step of move operation
        // `delete value['bar'];`
        delete value[parsedHash[parsedHash.length - 1]];
        entry.$ref.$ref = entry.mappedPathFromRoot;
      }

      pathFromRoot = entry.mappedPathFromRoot;
      hash = customRoots[entry.file][entry.hash];
    }
    else if (!entry.external) {
      // This $ref already resolves to the main JSON Schema file
      entry.$ref.$ref = entry.hash;
    }
    else if (entry.file === file && entry.hash === hash) {
      // This $ref points to the same value as the previous $ref, so remap it to the same path
      entry.$ref.$ref = pathFromRoot;
    }
    else if (entry.file === file && entry.hash.indexOf(hash + "/") === 0) {
      // This $ref points to a sub-value of the previous $ref, so remap it beneath that path
      entry.$ref.$ref = Pointer.join(pathFromRoot, Pointer.parse(entry.hash.replace(hash, "#")));
    }
    else {
      // We've moved to a new file or new hash
      file = entry.file;
      hash = entry.hash;

      // This is the first $ref to point to this value, so dereference the value.
      // Any other $refs that point to the sam  e value will point to this $ref instead
      if (entry.file in customRoots && customRoots[entry.file]["#"]) {
        entry.$ref.$ref = entry.mappedPathFromRoot;
        pathFromRoot = entry.mappedPathFromRoot;
      }
      else {
        entry.$ref = entry.parent[entry.key] = $Ref.dereference(entry.$ref, entry.value);
        pathFromRoot = entry.pathFromRoot;
      }

      if (entry.circular) {
        // This $ref points to itself
        entry.$ref.$ref = entry.pathFromRoot;
      }
    }

    $refs.propertyMap[pathFromRoot || entry.pathFromRoot] = entry.file + entry.hash;
    // console.log('    new value: %s', (entry.$ref && entry.$ref.$ref) ? entry.$ref.$ref : '[object Object]');
  }
}

/**
 * TODO
 */
function findInInventory (inventory, $refParent, $refKey) {
  for (let i = 0; i < inventory.length; i++) {
    let existingEntry = inventory[i];
    if (existingEntry.parent === $refParent && existingEntry.key === $refKey) {
      return existingEntry;
    }
  }
}

function removeFromInventory (inventory, entry) {
  let index = inventory.indexOf(entry);
  inventory.splice(index, 1);
}
