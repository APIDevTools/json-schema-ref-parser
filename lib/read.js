'use strict';

var ono      = require('ono'),
    parse    = require('../parse'),
    $Ref     = require('../ref'),
    debug    = require('./util/debug'),
    url    = require('./util/url'),
    Promise  = require('./util/promise');

module.exports = read;

/**
 * Reads the specified file path or URL, possibly from cache.
 *
 * @param {string} path - This path MUST already be resolved, since `read` doesn't know the resolution context
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with an object that contains a {@link $Ref}
 * and a flag indicating whether the {@link $Ref} came from cache or not.
 */
function read(path, $refs, options) {
  try {
    // Remove the URL fragment, if any
    path = url.stripHash(path);

    // Return from cache, if possible
    var $ref = $refs._get$Ref(path);
    if ($ref && !$ref.isExpired()) {
      debug('Reading "%s" from cache', path);
      return Promise.resolve({
        $ref: $ref,
        cached: true
      });
    }

    // Add a placeholder $ref to the cache, so we don't read this URL multiple times
    $ref = new $Ref($refs, path);

    // Resolve the path and parse the data
    return resolveAndRead(path, options)
      .then(function(resolver) {
        $ref.pathType = resolver.pathType;
        return parse(resolver.data, path, options);
      })
      .then(function(parsed) {
        $ref.value = parsed;
        return {$ref: $ref, cached: false};
      });
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Resolves the given file path or URL and returns its contents.
 *
 * @param {string} path - The file path or URL to read
 * @param {$RefParserOptions} options
 * @returns {Promise}
 */
function resolveAndRead(path, options) {
  return new Promise(function(resolve, reject) {
    debug('Resolving %s', path);
    var resolvers = util.getOrderedFunctions(options.resolve);
    util.runOrderedFunctions(resolvers, path, options).then(onResolved, onError);

    function onResolved(resolver) {
      resolve({
        pathType: resolver.name,
        data: resolver.result
      });
    }

    function onError(err) {
      if (err && !(err instanceof SyntaxError)) {
        reject(err);
      }
      reject(ono.syntax('Unable to resolve $ref pointer "%s"', path));
    }
  });
}
