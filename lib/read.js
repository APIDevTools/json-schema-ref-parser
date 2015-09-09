'use strict';

var fs          = require('fs'),
    http        = require('http'),
    https       = require('https'),
    parse       = require('./parse'),
    util        = require('./util'),
    $Ref        = require('./ref'),
    Promise     = require('./promise'),
    url         = require('url'),
    ono         = require('ono'),
    _isFunction = require('lodash/lang/isFunction');

module.exports = read;

/**
 * Reads the specified file path or URL, possibly from cache.
 *
 * @param {string} path - This path MUST already be resolved, since `read` doesn't know the resolution context
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with a {@link $Ref} object.
 * {@link $Ref#cached} will be true if the file was already cached.
 */
function read(path, parser, options) {
  try {
    // Remove the URL fragment, if any
    path = util.stripHash(path);
    util.debug('Reading %s', path);

    // Return from cache, if possible
    var $ref = parser.$refs._get$Ref(path);
    if ($ref && !$ref.isExpired()) {
      util.debug('    cached from %s', $ref.type);
      $ref.cached = true;
      return Promise.resolve($ref);
    }

    // Add a placeholder $ref to the cache, so we don't read this URL multiple times
    $ref = new $Ref(path);
    parser.$refs._set$Ref($ref);

    // Read and return the $ref
    return read$Ref($ref, parser, options);
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Reads the specified file path or URL and updates the given {@link $Ref} accordingly.
 *
 * @param {$Ref} $ref - The {@link $Ref} to read and update
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with the updated {@link $Ref} object (the same instance that was passed in)
 */
function read$Ref($ref, parser, options) {
  try {
    var promise = options.$refs.external && (read$RefFile($ref, options) || read$RefUrl($ref, options));

    if (promise) {
      return promise
        .then(function(data) {
          // Update the $ref with the parsed file contents
          var value = parse(data, $ref.path, options);
          $ref.setValue(value, options);
          $ref.cached = false;

          return $ref;
        });
    }
    else {
      return Promise.reject(ono.syntax('Unable to resolve $ref pointer "%s"', $ref.path));
    }
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/**
 * If the given {@link $Ref#path} is a local file, then the file is read
 * and {@link $Ref#type} is set to "fs".
 *
 * @param {$Ref} $ref - The {@link $Ref} to read and update
 * @param {$RefParserOptions} options
 *
 * @returns {Promise|undefined}
 * Returns a promise if {@link $Ref#path} is a local file.
 * The promise resolves with the raw file contents.
 */
function read$RefFile($ref, options) {
  if (process.browser || util.isUrl($ref.path)) {
    return;
  }

  $ref.type = 'fs';
  return new Promise(function(resolve, reject) {
    try {
      var file = decodeURI($ref.path);
    }
    catch (err) {
      reject(ono.uri(err, 'Malformed URI: %s', $ref.path));
    }

    util.debug('Opening file: %s', file);

    try {
      fs.readFile(file, function(err, data) {
        if (err) {
          reject(ono(err, 'Error opening file "%s"', $ref.path));
        }
        else {
          resolve(data);
        }
      });
    }
    catch (err) {
      reject(ono(err, 'Error opening file "%s"', file));
    }
  });
}

/**
 * If the given {@link $Ref#path} is a URL, then the file is downloaded
 * and {@link $Ref#type} is set to "http" or "https".
 *
 * @param {$Ref} $ref - The {@link $Ref} to read and update
 * @param {$RefParserOptions} options
 *
 * @returns {Promise|undefined}
 * Returns a promise if {@link $Ref#path} is a URL.
 * The promise resolves with the raw file contents.
 */
function read$RefUrl($ref, options) {
  var u = url.parse($ref.path);

  if (u.protocol === 'http:') {
    $ref.type = 'http';
    return download(http, u, options);
  }
  else if (u.protocol === 'https:') {
    $ref.type = 'https';
    return download(https, u, options);
  }
}

/**
 * Downloads the specified file.
 *
 * @param {http|https} protocol - Download via HTTP or HTTPS
 * @param {Url} u - A parsed {@link Url} object
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with the raw downloaded data, or rejects if there is an HTTP error.
 */
function download(protocol, u, options) {
  return new Promise(function(resolve, reject) {
    try {
      util.debug('Downloading file: %s', u);

      var req = protocol.get(
        {
          hostname: u.hostname,
          port: u.port,
          path: u.path,
          auth: u.auth
        },
        onResponse
      );

      if (_isFunction(req.setTimeout)) {
        req.setTimeout(5000);
      }

      req.on('timeout', function() {
        req.abort();
      });

      req.on('error', function(err) {
        reject(ono(err, 'Error downloading file "%s"', u.href));
      });
    }
    catch (err) {
      reject(ono(err, 'Error downloading file "%s"', u.href));
    }

    function onResponse(res) {
      var body;

      res.on('data', function(data) {
        // Data can be a string or a buffer
        body = body ? body.concat(data) : data;
      });

      res.on('end', function() {
        if (res.statusCode >= 400) {
          reject(ono('GET %s \nHTTP ERROR %d \n%s', u.href, res.statusCode, body));
        }
        else if ((res.statusCode === 204 || !body || !body.length) && !options.allow.empty) {
          reject(ono('GET %s \nHTTP 204: No Content', u.href));
        }
        else {
          resolve(body);
        }
      });

      res.on('error', function(err) {
        reject(ono(err, 'Error downloading file "%s"', u.href));
      });
    }
  });
}
