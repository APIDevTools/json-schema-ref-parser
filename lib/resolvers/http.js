"use strict";

var request = require("request"),
    ono = require("ono"),
    url = require("../util/url");

module.exports = {
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
  timeout: 5000, // 5 seconds

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
  canRead: function isHttp (file) {
    return url.isHttp(file.url);
  },

  /**
   * Reads the given URL and returns its raw contents as a Buffer.
   *
   * @param {object} file           - An object containing information about the referenced file
   * @param {string} file.url       - The full URL of the referenced file
   * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
   * @returns {Promise<Buffer>}
   */
  read: function readHttp (file) {
    var u = url.parse(file.url);

    if (process.browser && !u.protocol) {
      // Use the protocol of the current page
      u.protocol = url.parse(location.href).protocol;
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
    u = url.parse(u);
    redirects = redirects || [];
    redirects.push(u.href);

    get(u, httpOptions)
      .then(function (res) {
        if (res.statusCode >= 400) {
          throw ono({ status: res.statusCode }, "HTTP ERROR %d", res.statusCode);
        }
        else {
          resolve(res.body || new Buffer(0));
        }
      })
      .catch(function (err) {
        reject(ono(err, "Error downloading", u.href));
      });
  });
}

/**
 * Sends an HTTP GET request.
 *
 * @param {Url} u - A parsed {@link Url} object
 * @param {object} httpOptions - The `options.resolve.http` object
 *
 * @returns {Promise<Response>}
 * The promise resolves with the HTTP Response object.
 */
function get (u, httpOptions) {
  return new Promise(function (resolve, reject) {
    var req = request.get(u, {
      headers: httpOptions.headers || {},
      maxRedirects: httpOptions.redirects,
      proxy: httpOptions.proxy,
      timeout: httpOptions.timeout,
      withCredentials: httpOptions.withCredentials
    });

    req.on("error", reject);

    req.once("response", function (res) {
      res.body = new Buffer(0);

      res.on("data", function (data) {
        res.body = Buffer.concat([res.body, new Buffer(data)]);
      });

      res.on("error", reject);

      res.on("end", function () {
        resolve(res);
      });
    });
  });
}
