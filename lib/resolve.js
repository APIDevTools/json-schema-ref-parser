'use strict';

var Promise   = require('./promise'),
    PathOrUrl = require('./path-or-url'),
    read      = require('./read'),
    util      = require('./util'),
    _forEach  = require('lodash/collection/forEach'),
    _isArray  = require('lodash/lang/isArray'),
    _isObject = require('lodash/lang/isObject'),
    _isString = require('lodash/lang/isString');

module.exports = resolve;

/**
 * @param {$RefParser} parser
 * @param {Options} options
 * @returns {Promise}
 */
function resolve(parser, options) {
  try {
    if (!options.$refs.external) {
      // Nothing to resolve, so exit early
      return Promise.resolve();
    }

    util.debug('Resolving $ref pointers in %s', parser._base);
    var promises = crawl(parser.schema, parser._base, parser, options);
    return Promise.all(promises);
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/**
 * @param {object} obj
 * @param {PathOrUrl} pathOrUrl
 * @param {$RefParser} parser
 * @param {Options} options
 * @returns {Promise[]}
 */
function crawl(obj, pathOrUrl, parser, options) {
  var promises = [];

  if (_isObject(obj) || _isArray(obj)) {
    _forEach(obj, function(value, key) {
      var keyPath = new PathOrUrl(pathOrUrl);
      keyPath.hash += '/' + key;

      if (isExternal$Ref(key, value)) {
        // We found a $ref pointer
        util.debug('Resolving $ref pointer "%s" at %s, relative to %s', value, keyPath, pathOrUrl);
        var $refString = pathOrUrl.resolve(value, {allowFileHash: true});
        var $refPathOrUrl = new PathOrUrl($refString, {allowFileHash: true});

        // Crawl the $ref pointer
        var promise = crawl$Ref($refPathOrUrl, parser, options)
          .catch(function(err) {
            throw util.newError(SyntaxError, err, 'Error at %s', promise.name);
          });
        promise.name = keyPath.format();
        promises.push(promise);
      }
      else {
        promises = promises.concat(crawl(value, keyPath, parser, options));
      }
    });
  }
  return promises;
}

/**
 * @param {PathOrUrl} pathOrUrl
 * @param {$RefParser} parser
 * @param {Options} options
 * @returns {Promise}
 */
function crawl$Ref(pathOrUrl, parser, options) {
  return read(pathOrUrl, parser, options)
    .then(function($ref) {
      // If a cached $ref is returned, then we DON'T need to crawl it
      if (!$ref.cached) {
        // This is a new $ref, so we need to crawl it
        util.debug('Resolving $ref pointers in %s', $ref.pathOrUrl);
        var promises = crawl($ref.value, $ref.pathOrUrl, parser, options);
        return Promise.all(promises);
      }
    });
}

function isExternal$Ref(key, value) {
  return key === '$ref' && value && _isString(value) && value[0] !== '#';
}
