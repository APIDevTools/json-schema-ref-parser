'use strict';

var fs          = require('fs'),
    http        = require('http'),
    https       = require('https'),
    parse       = require('./parse'),
    util        = require('./util'),
    $Ref        = require('./ref'),
    PathOrUrl   = require('./path-or-url'),
    Promise     = require('./promise'),
    _isFunction = require('lodash/lang/isFunction');

module.exports = read;

/**
 * @param {PathOrUrl} pathOrUrl
 * @param {$RefParser} parser
 * @param {Options} options
 * @returns {Promise}
 */
function read(pathOrUrl, parser, options) {
  try {
    // Remove the URL fragment, if any
    pathOrUrl.hash = '';
    pathOrUrl = new PathOrUrl(pathOrUrl.format());
    util.debug('Reading %s', pathOrUrl);

    // Return from cache, if possible
    var $ref = parser.$refs._get$Ref(pathOrUrl);
    if ($ref && !$ref.isExpired()) {
      util.debug('    cached from %s', $ref.type);
      $ref.cached = true;
      return Promise.resolve($ref);
    }

    // Add a placeholder $ref to the cache, so we don't read this URL multiple times
    $ref = new $Ref(pathOrUrl);
    parser.$refs._set$Ref($ref);

    // Read and return the $ref
    return read$Ref($ref, parser, options);
  }
  catch (e) {
    return Promise.reject(e);
  }
}

var $refTypes = [
  {name: 'http', handler: httpDownload},
  {name: 'https', handler: httpsDownload},
  {name: 'fs', handler: readFile}
];

/**
 * @param {$Ref} $ref
 * @param {$RefParser} parser
 * @param {Options} options
 * @returns {Promise}
 */
function read$Ref($ref, parser, options) {
  var typeName = '', promise = null;

  try {
    // Read the URL, based on its type
    $refTypes.some(function(type, index) {
      typeName = type.name;
      util.debug('    trying %s', typeName);
      return promise = type.handler.call(parser, $ref.pathOrUrl, options);
    });

    if (promise) {
      // Update the $ref
      $ref.type = typeName;

      return promise
        .then(function(data) {
          // Update the $ref with the parsed file contents
          var value = parse(data, $ref.pathOrUrl, options);
          $ref.setValue(value, options);
          $ref.cached = false;

          return $ref;
        });
    }
    else {
      return Promise.reject(util.newError(SyntaxError, 'Unable to resolve $ref pointer "%s"', $ref.pathOrUrl));
    }
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/**
 * @this $RefParser
 * @param {PathOrUrl} pathOrUrl
 * @param {Options} options
 * @returns {Promise|undefined}
 */
function readFile(pathOrUrl, options) {
  if (process.browser || !pathOrUrl.isFile || !options.$refs.external) {
    return;
  }

  var file = pathOrUrl.format();
  return new Promise(function(resolve, reject) {
    try {
      util.debug('Reading file: %s', file);

      fs.readFile(file, function(err, data) {
        if (err) {
          reject(util.newError(err, 'Error opening file "%s"', file));
        }
        else {
          resolve(data);
        }
      });
    }
    catch (err) {
      reject(util.newError(err, 'Error opening file "%s"', file));
    }
  });
}

/**
 * @this $RefParser
 * @param {PathOrUrl} pathOrUrl
 * @param {Options} options
 * @returns {Promise|undefined}
 */
function httpDownload(pathOrUrl, options) {
  if (!options.$refs.external) {
    return;
  }

  if (pathOrUrl.protocol === 'http:') {
    return download(http, pathOrUrl, options);
  }
}

/**
 * @this $RefParser
 * @param {PathOrUrl} pathOrUrl
 * @param {Options} options
 * @returns {Promise|undefined}
 */
function httpsDownload(pathOrUrl, options) {
  if (!options.$refs.external) {
    return;
  }

  if (pathOrUrl.protocol === 'https:') {
    return download(https, pathOrUrl, options);
  }
}

/**
 * @param {http|https} protocol
 * @param {PathOrUrl} pathOrUrl
 * @param {Options} options
 * @returns {Promise}
 */
function download(protocol, pathOrUrl, options) {
  return new Promise(function(resolve, reject) {
    try {
      util.debug('Downloading file: %s', pathOrUrl);

      var req = protocol.get(
        {
          hostname: pathOrUrl.hostname,
          port: pathOrUrl.port,
          path: pathOrUrl.path,
          auth: pathOrUrl.auth
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
        reject(util.newError(err, 'Error downloading file "%s"', pathOrUrl));
      });
    }
    catch (err) {
      reject(util.newError(err, 'Error downloading file "%s"', pathOrUrl));
    }

    function onResponse(res) {
      var body;

      res.on('data', function(data) {
        // Data can be a string or a buffer
        body = body ? body.concat(data) : data;
      });

      res.on('end', function() {
        if (res.statusCode >= 400) {
          reject(util.newError('GET %s \nHTTP ERROR %d \n%s', pathOrUrl, res.statusCode, body));
        }
        else if ((res.statusCode === 204 || !body || !body.length) && !options.allow.empty) {
          reject(util.newError('GET %s \nHTTP 204: No Content', pathOrUrl));
        }
        else {
          resolve(body);
        }
      });

      res.on('error', function(err) {
        reject(util.newError(err, 'Error downloading file "%s"', pathOrUrl));
      });
    }
  });
}
