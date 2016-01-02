/** !
 * JSON Schema $Ref Parser v2.1.2
 *
 * @link https://github.com/BigstickCarpet/json-schema-ref-parser
 * @license MIT
 */
'use strict';

var $Ref    = require('./ref'),
    Pointer = require('./pointer'),
    util    = require('./util'),
    url     = require('url');

module.exports = bundle;

/**
 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
 * only has *internal* references, not any *external* references.
 * This method mutates the JSON schema object, adding new references and re-mapping existing ones.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 */
function bundle(parser, options) {
  util.debug('Bundling $ref pointers in %s', parser._basePath);

  optimize(parser.$refs);
  remap(parser.$refs, options);
  dereference(parser._basePath, parser.$refs, options);
}

/**
 * Optimizes the {@link $Ref#referencedAt} list for each {@link $Ref} to contain as few entries
 * as possible (ideally, one).
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
 * to the ENTIRE file, that's the only one we care about.  The other three can just be remapped to point
 * inside the third one.
 *
 * On the other hand, if the third reference DIDN'T exist, then the first and second would both be
 * significant, since they point to different parts of the file. The fourth reference is not significant,
 * since it can still be remapped to point inside the first one.
 *
 * @param {$Refs} $refs
 */
function optimize($refs) {
  Object.keys($refs._$refs).forEach(function(key) {
    var $ref = $refs._$refs[key];

    // Find the first reference to this $ref
    var first = $ref.referencedAt.filter(function(at) { return at.firstReference; })[0];

    // Do any of the references point to the entire file?
    var entireFile = $ref.referencedAt.filter(function(at) { return at.hash === '#'; });
    if (entireFile.length === 1) {
      // We found a single reference to the entire file.  Done!
      $ref.referencedAt = entireFile;
    }
    else if (entireFile.length > 1) {
      // We found more than one reference to the entire file.  Pick the first one.
      if (entireFile.indexOf(first) >= 0) {
        $ref.referencedAt = [first];
      }
      else {
        $ref.referencedAt = entireFile.slice(0, 1);
      }
    }
    else {
      // There are noo references to the entire file, so optimize the list of reference points
      // by eliminating any duplicate/redundant ones (e.g. "fourth" in the example above)
console.log('========================= %s BEFORE =======================', $ref.path, JSON.stringify($ref.referencedAt, null, 2));
      [first].concat($ref.referencedAt).forEach(function(at) {
        dedupe(at, $ref.referencedAt);
      });
console.log('========================= %s AFTER =======================', $ref.path, JSON.stringify($ref.referencedAt, null, 2));
    }
  });
}

/**
 * Removes redundant entries from the {@link $Ref#referencedAt} list.
 *
 * @param {object} original - The {@link $Ref#referencedAt} entry to keep
 * @param {object[]} dupes - The {@link $Ref#referencedAt} list to dedupe
 */
function dedupe(original, dupes) {
  for (var i = dupes.length - 1; i >= 0; i--) {
    var dupe = dupes[i];
    if (dupe !== original && dupe.hash.indexOf(original.hash) === 0) {
      dupes.splice(i, 1);
    }
  }
}

/**
 * Re-maps all $ref pointers in the schema, so that they are relative to the root of the schema.
 *
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 */
function remap($refs, options) {
  var remapped = [];

  // Crawl the schema and determine the re-mapped values for all $ref pointers.
  // NOTE: We don't actually APPLY the re-mappings yet, since that can affect other re-mappings
  Object.keys($refs._$refs).forEach(function(key) {
    var $ref = $refs._$refs[key];
    crawl($ref.value, $ref.path + '#', $refs, remapped, options);
  });

  // Now APPLY all of the re-mappings
  for (var i = 0; i < remapped.length; i++) {
    var mapping = remapped[i];
    mapping.old$Ref.$ref = mapping.new$Ref.$ref;
  }
}

/**
 * Recursively crawls the given value, and re-maps any JSON references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} path - The path to use for resolving relative JSON references
 * @param {$Refs} $refs - The resolved JSON references
 * @param {object[]} remapped - An array of the re-mapped JSON references
 * @param {$RefParserOptions} options
 */
function crawl(obj, path, $refs, remapped, options) {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(function(key) {
      var keyPath = Pointer.join(path, key);
      var value = obj[key];

      if ($Ref.is$Ref(value)) {
        // We found a $ref, so resolve it
        util.debug('Re-mapping $ref pointer "%s" at %s', value.$ref, keyPath);
        var $refPath = url.resolve(path, value.$ref);
        var pointer = $refs._resolve($refPath, options);

        // Find the path from the root of the JSON schema
        var hash = util.path.getHash(value.$ref);
        var referencedAt = pointer.$ref.referencedAt.filter(function(at) {
          return hash.indexOf(at.hash) === 0;
        })[0];

console.log(
  'referencedAt.pathFromRoot =', referencedAt.pathFromRoot,
  '\nreferencedAt.hash         =', referencedAt.hash,
  '\nhash                      =', hash,
  '\npointer.path.hash         =', util.path.getHash(pointer.path)
);

        // Re-map the value
        var new$RefPath = referencedAt.pathFromRoot + util.path.getHash(pointer.path).substr(1);
        util.debug('    new value: %s', new$RefPath);
        remapped.push({
          old$Ref: value,
          new$Ref: {$ref: new$RefPath}  // Note: DON'T name this property `new` (https://github.com/BigstickCarpet/json-schema-ref-parser/issues/3)
        });
      }
      else {
        crawl(value, keyPath, $refs, remapped, options);
      }
    });
  }
}

/**
 * Dereferences each external $ref pointer exactly ONCE.
 *
 * @param {string} basePath
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 */
function dereference(basePath, $refs, options) {
  basePath = util.path.stripHash(basePath);

  Object.keys($refs._$refs).forEach(function(key) {
    var $ref = $refs._$refs[key];

    if ($ref.referencedAt.length > 0) {
      $refs.set(basePath + $ref.referencedAt[0].pathFromRoot, $ref.value, options);
    }
  });
}
