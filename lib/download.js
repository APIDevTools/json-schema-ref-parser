'use strict';

var http    = require('http'),
    https   = require('https'),
    url     = require('url'),
    util    = require('./util'),
    Promise = require('./promise'),
    ono     = require('ono');

module.exports = download;

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
          if (redirects.length > options.http.redirects) {
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
        else if (res.statusCode === 204 && !options.allow.empty) {
          throw ono({status: 204}, 'HTTP 204 (No Content)');
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
      headers: options.http.headers,
      withCredentials: options.http.withCredentials
    });

    if (typeof req.setTimeout === 'function') {
      req.setTimeout(options.http.timeout);
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
