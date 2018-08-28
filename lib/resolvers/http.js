'use strict';
exports.__esModule = true;
var http = require('http');
var https = require('https');
var ono = require('ono');
var url_1 = require('../util/url');
var debug_1 = require('../util/debug');
exports.default = {
  /**
     * The order that this resolver will run, in relation to other resolvers.
     *
     * @type {number}
     */
  order: 200,
  /**
     * HTTP headers to send when downloading files.
     *
     * @example:
     * {
     *   "User-Agent": "JSON Schema $Ref Parser",
     *   Accept: "application/json"
     * }
     *
     * @type {object}
     */
  headers: null,
  /**
     * HTTP request timeout (in milliseconds).
     *
     * @type {number}
     */
  timeout: 5000,
  /**
     * The maximum number of HTTP redirects to follow.
     * To disable automatic following of redirects, set this to zero.
     *
     * @type {number}
     */
  redirects: 5,
  /**
     * The `withCredentials` option of XMLHttpRequest.
     * Set this to `true` if you're downloading files from a CORS-enabled server that requires authentication
     *
     * @type {boolean}
     */
  withCredentials: false,
  /**
     * Determines whether this resolver can read a given file reference.
     * Resolvers that return true will be tried in order, until one successfully resolves the file.
     * Resolvers that return false will not be given a chance to resolve the file.
     *
     * @param {object} file           - An object containing information about the referenced file
     * @param {string} file.url       - The full URL of the referenced file
     * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
     * @returns {boolean}
     */
  canRead: function (file) { return url_1.isHttp(file.url); },
  /**
     * Reads the given URL and returns its raw contents as a Buffer.
     *
     * @param {object} file           - An object containing information about the referenced file
     * @param {string} file.url       - The full URL of the referenced file
     * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
     * @returns {Promise<Buffer>}
     */
  read: function readHttp (file) {
    var u = url_1.parse(file.url);
    if (process.browser && !u.protocol) {
      // Use the protocol of the current page
      u.protocol = url_1.parse(location.href).protocol;
    }
    return download(u, this);
  }
};
/**
 * Downloads the given file.
 *
 * @param {Url|string} u        - The url to download (can be a parsed {@link Url} object)
 * @param {object} httpOptions  - The `options.resolve.http` object
 * @param {number} [redirects]  - The redirect URLs that have already been followed
 *
 * @returns {Promise<Buffer>}
 * The promise resolves with the raw downloaded data, or rejects if there is an HTTP error.
 */
function download (u, httpOptions, redirects) {
  return new Promise(function (resolve, reject) {
    u = url_1.parse(u);
    redirects = redirects || [];
    redirects.push(u.href);
    get(u, httpOptions)
      .then(function (res) {
        if (res.statusCode >= 400) {
          throw ono({ status: res.statusCode }, 'HTTP ERROR %d', res.statusCode);
        }
        else if (res.statusCode >= 300) {
          if (redirects.length > httpOptions.redirects) {
            reject(ono({ status: res.statusCode }, 'Error downloading %s. \nToo many redirects: \n  %s', redirects[0], redirects.join(' \n  ')));
          }
          else if (!res.headers.location) {
            throw ono({ status: res.statusCode }, 'HTTP %d redirect with no location header', res.statusCode);
          }
          else {
            debug_1.default('HTTP %d redirect %s -> %s', res.statusCode, u.href, res.headers.location);
            var redirectTo = url_1.resolve(u, res.headers.location);
            download(redirectTo, httpOptions, redirects).then(resolve, reject);
          }
        }
        else {
          resolve(res.body || new Buffer(0));
        }
      }).catch(function (err) {
        reject(ono(err, 'Error downloading', u.href));
      });
  });
}
/**
 * Sends an HTTP GET request.
 *
 * @param {Url} u - A parsed {@link Url} object
 * @param {object} httpOptions - The `options.resolve.http` object
 * @param {number} retries - How many times to retry dropped connections. Default: 3
 *
 * @returns {Promise<Response>}
 * The promise resolves with the HTTP Response object.
 */
function get (u, httpOptions, retries) {
  if (retries === void 0) { retries = 3; }
  return new Promise(function (resolve, reject) {
    debug_1.default('GET', u.href);
    var protocol = u.protocol === 'https:' ? https : http;
    var req = protocol.get({
      hostname: u.hostname,
      port: u.port,
      path: u.path,
      auth: u.auth,
      protocol: u.protocol,
      headers: httpOptions.headers || {},
      withCredentials: httpOptions.withCredentials
    });
    if (typeof req.setTimeout === 'function') {
      req.setTimeout(httpOptions.timeout);
    }
    req.on('timeout', function () {
      req.abort();
    });
    req.on('error', function (err) {
      if (err.code === 'ECONNRESET' && retries > 0) { resolve(get(u, httpOptions, retries - 1)); }
      else { reject(err); }
    });
    req.once('response', function (res) {
      res.body = new Buffer(0);
      res.on('data', function (data) {
        res.body = Buffer.concat([res.body, new Buffer(data)]);
      });
      res.on('error', reject);
      res.on('end', function () {
        resolve(res);
      });
    });
  });
}
