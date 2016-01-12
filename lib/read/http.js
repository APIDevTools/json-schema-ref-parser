'use strict';

var http    = require('http'),
    https   = require('https'),
    url     = require('url'),
    util    = require('../util'),
    Promise = require('../util/promise'),
    ono     = require('ono');

module.exports = readHttp;

/**
 * The order that this reader will run, in relation to other readers.
 */
module.exports.order = 2;

/**
 * How long a URL's contents will be cached before it is re-downloaded.
 * Setting this to zero disables caching and the file will be re-downloaded every time.
 */
module.exports.cache = 300000;  // 5 minutes

/**
 * HTTP headers to send when downloading files.
 */
module.exports.headers = null;

/**
 * HTTP request timeout (in milliseconds).
 */
module.exports.timeout = 5000; // 5 seconds

/**
 * The maximum number of HTTP redirects to follow.
 * To disable automatic following of redirects, set this to zero.
 */
module.exports.redirects = 5;

/**
 * The `withCredentials` option of XMLHttpRequest.
 * Set this to `true` if you're downloading files from a CORS-enabled server that requires authentication
 */
module.exports.withCredentials = false;

/**
 * Reads the given URL and returns its raw contents as a Buffer.
 *
 * @param {string} path - The URL to read
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<Buffer>|undefined}
 * If `path` is NOT a supported URL, then `undefiend` is returned.
 * Otherwise, a Promise is returned, and it will resolve with the downloaded contents as a Buffer.
 */
function readHttp(path, options) {
  var u = url.parse(path);

  if (process.browser && !u.protocol) {
    // Use the protocol of the current page
    u.protocol = url.parse(location.href).protocol;
  }

  if (u.protocol === 'http:' || u.protocol === 'https:') {
    return download(u, options);
  }
  else {
    return Promise.reject(new SyntaxError('Not an HTTP/HTTPS URL'));
  }
}

/**
 * Downloads the given file.
 *
 * @param {Url|string} u - The url to download (can be a parsed {@link Url} object)
 * @param {$RefParserOptions} options
 * @param {number} [redirects] - The redirect URLs that have already been followed
 *
 * @returns {Promise<Buffer>}
 * The promise resolves with the raw downloaded data, or rejects if there is an HTTP error.
 */
function download(u, options, redirects) {
  return new Promise(function(resolve, reject) {
    u = url.parse(u);
    redirects = redirects || [];
    redirects.push(u.href);

    get(u, options)
      .then(function(res) {
        if (res.statusCode >= 400) {
          throw ono({status: res.statusCode}, 'HTTP ERROR %d', res.statusCode);
        }
        else if (res.statusCode >= 300) {
          if (redirects.length > options.resolve.http.redirects) {
            reject(ono({status: res.statusCode}, 'Error downloading %s. \nToo many redirects: \n  %s',
              redirects[0], redirects.join(' \n  ')));
          }
          else if (!res.headers.location) {
            throw ono({status: res.statusCode}, 'HTTP %d redirect with no location header', res.statusCode);
          }
          else {
            util.debug('HTTP %d redirect %s -> %s', res.statusCode, u.href, res.headers.location);
            var redirectTo = url.resolve(u, res.headers.location);
            download(redirectTo, options, redirects).then(resolve, reject);
          }
        }
        else {
          resolve(res.body || new Buffer(0));
        }
      })
      .catch(function(err) {
        reject(ono(err, 'Error downloading', u.href));
      });
  });
}

/**
 * Sends an HTTP GET request.
 *
 * @param {Url} u - A parsed {@link Url} object
 * @param {$RefParserOptions} options
 *
 * @returns {Promise<Response>}
 * The promise resolves with the HTTP Response object.
 */
function get(u, options) {
  return new Promise(function(resolve, reject) {
    util.debug('GET', u.href);

    var protocol = u.protocol === 'https:' ? https : http;
    var req = protocol.get({
      hostname: u.hostname,
      port: u.port,
      path: u.path,
      auth: u.auth,
      headers: options.resolve.http.headers || {},
      withCredentials: options.resolve.http.withCredentials
    });

    if (typeof req.setTimeout === 'function') {
      req.setTimeout(options.resolve.http.timeout);
    }

    req.on('timeout', function() {
      req.abort();
    });

    req.on('error', reject);

    req.once('response', function(res) {
      res.body = new Buffer(0);

      res.on('data', function(data) {
        res.body = Buffer.concat([res.body, new Buffer(data)]);
      });

      res.on('error', reject);

      res.on('end', function() {
        resolve(res);
      });
    });
  });
}
