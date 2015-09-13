/**!
 * JSON Schema $Ref Parser v1.0.0-alpha.18
 *
 * @link https://github.com/BigstickCarpet/json-schema-ref-parser
 * @license MIT
 */
'use strict';

var $Ref = require('./ref'),
    util = require('./util'),
    url  = require('url');

module.exports = bundle;

/**
 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
 * only has *internal* references, not any *external* references.
 * This method mutates the JSON schema object, adding new references and remapping existing ones.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 */
function bundle(parser, options) {
  util.debug('Bundling $ref pointers in %s', parser._basePath);

  var $refs = parser.$refs;
  var basePath = util.path.stripHash(parser._basePath);
  Object.keys($refs._$refs).forEach(function(key) {
    var $ref = $refs._$refs[key];

    if (!$ref.pathFromRoot) {
      // This is the root of the JSON schema, so we don't need to do anything
      // since all of its $refs are already relative to the schema root
      return;
    }

    // Crawl the value, re-mapping its pointer
    crawl($ref.value, $ref.path + '#', $ref.pathFromRoot, parser.$refs, options);

    // Replace the original $ref with the resolved value
    //$refs.set(basePath + $ref.pathFromRoot, $ref.value, options);
  });
}

/**
 *
 * @param obj
 * @param path
 * @param pointer
 * @param $refs
 * @param options
 */
function crawl(obj, path, pointer, $refs, options) {
  if (obj && typeof(obj) === 'object') {
    Object.keys(obj).forEach(function(key) {
      var keyPath = path + '/' + key;
      var value = obj[key];

      if ($Ref.is$Ref(value)) {
        // We found a $ref, so resolve it
        util.debug('Bundling $ref pointer "%s" at %s', value.$ref, keyPath);
        var $refPath = url.resolve(path, value.$ref);
        var resolved$Ref = $refs._resolve($refPath, options);
        var $ref = resolved$Ref.$ref;

        //value.$ref = $ref.pathFromRoot
      }
      else {
        crawl(value, keyPath, pointer, $refs, options);
      }
    });
  }
}
