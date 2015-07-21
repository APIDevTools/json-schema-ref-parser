'use strict';

var PathOrUrl = require('./path-or-url'),
    $Ref      = require('./ref'),
    util      = require('./util'),
    _forEach  = require('lodash/collection/forEach'),
    _isArray  = require('lodash/lang/isArray'),
    _isObject = require('lodash/lang/isObject');

module.exports = dereference;

/**
 * @param {$RefParser} parser
 * @param {Options} options
 * @returns {Promise}
 */
function dereference(parser, options) {
  util.debug('Dereferencing $ref pointers in %s', parser._base);
  crawl(parser.schema, parser._base, [], parser.$refs, options);
}

/**
 * @param {object} obj
 * @param {PathOrUrl} pathOrUrl
 * @param {object[]} parents
 * @param {$Refs} $refs
 * @param {Options} options
 */
function crawl(obj, pathOrUrl, parents, $refs, options) {
  if (_isObject(obj) || _isArray(obj)) {
    parents.push(obj);

    _forEach(obj, function(value, key) {
      var keyPath = new PathOrUrl(pathOrUrl);
      keyPath.hash += '/' + key;

      if ($Ref.isAllowed(value, options)) {
        // We found a $ref pointer.
        util.debug('Dereferencing $ref pointer "%s" at %s', value.$ref, keyPath);
        var $refString = pathOrUrl.resolve(value.$ref, {allowFileHash: true});
        var $refPathOrUrl = new PathOrUrl($refString, {allowFileHash: true});

        // Dereference the $ref pointer
        var resolved$Ref = $refs._resolve($refPathOrUrl, options);
        obj[key] = value = resolved$Ref.value;

        // Crawl the dereferenced value (unless it's circular)
        if (parents.indexOf(value) === -1) {
          crawl(resolved$Ref.value, resolved$Ref.pathOrUrl, parents, $refs, options);
        }
      }
      else if (parents.indexOf(value) === -1) {
        crawl(value, keyPath, parents, $refs, options);
      }
    });

    parents.pop();
  }
}
