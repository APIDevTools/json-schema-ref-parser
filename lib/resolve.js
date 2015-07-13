'use strict';

var Promise   = require('./promise'),
    Url       = require('./url'),
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

    util.debug('Resolving $ref pointers in %s', parser._url);
    var promises = crawl(parser.schema, parser._url, parser, options);
    return Promise.all(promises);
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/**
 * @param {object} obj
 * @param {Url} url
 * @param {$RefParser} parser
 * @param {Options} options
 * @returns {Promise[]}
 */
function crawl(obj, url, parser, options) {
  var promises = [];

  if (_isObject(obj) || _isArray(obj)) {
    _forEach(obj, function(value, key) {
      var keyUrl = new Url(url);
      keyUrl.hash = (keyUrl.hash || '#') + '/' + key;

      if (isExternal$Ref(key, value)) {
        // We found a $ref pointer
        util.debug('Resolving $ref pointer "%s" at %s', value, keyUrl);
        var $refUrl = url.resolve(value);

        // Crawl the $ref pointer
        var promise = crawl$Ref($refUrl, parser, options)
          .catch(function(err) {
            throw util.newError(SyntaxError, err, 'Error at %s', promise.name);
          });
        promise.name = keyUrl.format();
        promises.push(promise);
      }
      else {
        promises = promises.concat(crawl(value, keyUrl, parser, options));
      }
    });
  }
  return promises;
}

/**
 * @param {Url} url
 * @param {$RefParser} parser
 * @param {Options} options
 * @returns {Promise}
 */
function crawl$Ref(url, parser, options) {
  return read(url, parser, options)
    .then(function($ref) {
      // If a cached $ref is returned, then we DON'T need to crawl it
      if (!$ref.cached) {
        // This is a new $ref, so we need to crawl it
        util.debug('Resolving $ref pointers in %s', $ref.url);
        var promises = crawl($ref.value, $ref.url, parser, options);
        return Promise.all(promises);
      }
    });
}

function isExternal$Ref(key, value) {
  return key === '$ref' && value && _isString(value) && value[0] !== '#';
}
