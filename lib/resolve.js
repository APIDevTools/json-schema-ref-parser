'use strict';

var ono      = require('ono'),
    debug    = require('./util/debug'),
    url      = require('./util/url'),
    plugins  = require('./util/plugins'),
    Promise  = require('./util/promise');

module.exports = resolve;

/**
 * Resolves the specified file path or URL to its value.
 *
 * @param {string} path - This full (absolute) path or URL
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with a tuple containing the following values:
 *  - The $Ref object for this file
 *  - A "file object", which can then be passed to parser plug-ins
 */
function resolve(path, $refs, options) {
  try {
    // Remove the URL fragment, if any
    path = url.stripHash(path);

    // Add a new $Ref for this file, even though we don't have the value yet.
    // This ensures that we don't simultaneously resolve the same file multiple times
    var $ref = $refs._add(path);

    // This "file object" will be passed to all resolvers
    var file = {
      url: path,
      extension: url.getExtension(path),
    };

    return resolveFile(file, options)
      .then(function(resolver) {
        $ref.pathType = resolver.plugin.name;
        file.data = resolver.result;
        return file;
      });
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Resolves the given file, using the configured resolver plugins
 *
 * @param {object} file           - An object containing information about the referenced file
 * @param {string} file.url       - The full URL of the referenced file
 * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with the raw file contents and the resolver that was used.
 */
function resolveFile(file, options) {
  return new Promise(function(resolvePromise, rejectPromise) {
    debug('Resolving %s', file.url);

    // Find the resolvers that can resolve this file
    var resolvers = plugins.all(options.resolve);
    resolvers = plugins.filter(resolvers, 'canResolve', file);

    // Run the resolvers, in order, until one of them succeeds
    plugins.sort(resolvers);
    plugins.run(resolvers, 'resolve', file)
      .then(resolvePromise, onError);

    function onError(err) {
      // Throw the original error, if it's one of our own (user-friendly) errors.
      // Otherwise, throw a generic, friendly error.
      if (err && !(err instanceof SyntaxError)) {
        rejectPromise(err);
      }
      else {
        rejectPromise(ono.syntax('Unable to resolve $ref pointer "%s"', file.url));
      }
    }
  });
}
