"use strict";

const { ono } = require("@jsdevtools/ono");
const url = require("../util/url");
const { ResolverError } = require("../util/errors");

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
  canRead (file) {
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
  read (file) {
    let u = url.parse(file.url);

    if (typeof window !== "undefined" && !u.protocol) {
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
  u = url.parse(u);
  redirects = redirects || [];
  redirects.push(u.href);

  return get(u, httpOptions)
    .then((res) => {
      if (res.status >= 400) {
        throw ono({ status: res.statusCode }, `HTTP ERROR ${res.status}`);
      }
      else if (res.status >= 300) {
        if (redirects.length > httpOptions.redirects) {
          throw new ResolverError(ono({ status: res.status },
            `Error downloading ${redirects[0]}. \nToo many redirects: \n  ${redirects.join(" \n  ")}`));
        }
        else if (!res.headers.location) {
          throw ono({ status: res.status }, `HTTP ${res.status} redirect with no location header`);
        }
        else {
          // console.log('HTTP %d redirect %s -> %s', res.status, u.href, res.headers.location);
          let redirectTo = url.resolve(u, res.headers.location);
          return download(redirectTo, httpOptions, redirects);
        }
      }
      else {
        return res.body ? res.arrayBuffer().then(buf => Buffer.from(buf)) : Buffer.alloc(0);
      }
    })
    .catch((err) => {
      throw new ResolverError(ono(err, `Error downloading ${u.href}`), u.href);
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
  let controller;
  let timeoutId;
  if (httpOptions.timeout) {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), httpOptions.timeout);
  }

  return fetch(u, {
    method: "GET",
    headers: httpOptions.headers || {},
    credentials: httpOptions.withCredentials ? "include" : "same-origin",
    signal: controller ? controller.signal : null,
  }).then(response => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return response;
  });
}
