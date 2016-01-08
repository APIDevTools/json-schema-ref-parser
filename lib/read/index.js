'use strict';

var parse    = require('../parse'),
    $Ref     = require('../ref'),
    util     = require('../util'),
    Promise  = require('../util/promise'),
    ono      = require('ono');

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
    path = util.path.stripHash(path);
    util.debug('Reading %s', path);

    // Return from cache, if possible
    var $ref = $refs._get$Ref(path);
    if ($ref && !$ref.isExpired()) {
      util.debug('    cached from %s', $ref.pathType);
      return Promise.resolve({
        $ref: $ref,
        cached: true
      });
    }

    // Add a placeholder $ref to the cache, so we don't read this URL multiple times
    $ref = new $Ref($refs, path);

    // Read the file
    return readers(path, options)
      .then(function(reader) {
        $ref.pathType = reader.pathType;
        return parse(reader.data, path, options);
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
 * Reads the given file path or URL and returns its raw contents as a Buffer.
 *
 * @param {string} path - The file path or URL to read
 * @param {$RefParserOptions} options
 * @returns {Promise<Buffer>}
 */
function readers(path, options) {
  return new Promise(function(resolve, reject) {
    var promise, pathType;

    // Run each reader in order, until one returns a Promise
    util.orderedFunctions(options.resolve)
      .some(function(reader) {
        promise = reader.fn(path, options);
        if (promise) {
          pathType = reader.name;
          return true;
        }
      });

    // If one of the readers returned a Promise, then wait on it
    if (promise) {
      promise.then(
        function(data) {
          resolve({data: data, pathType: pathType});
        },
        reject);
    }
    else {
      reject(ono.syntax('Unable to resolve $ref pointer "%s"', path));
    }
  });
}
