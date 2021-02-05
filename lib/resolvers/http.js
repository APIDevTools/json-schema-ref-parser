"use strict";

require("isomorphic-fetch");
require("abort-controller/polyfill");
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
   * @returns {Promise<Uint8Array | string>}
   */
  read (file) {
    let u = url.parse(file.url);

    if (process.browser && !u.protocol) {
      // Use the protocol of the current page
      u.protocol = url.parse(location.href).protocol;
    }

    return download(u, this, []);
  }
};

/**
 * Downloads the given file.
 *
 * @param {Url|string} u        - The url to download (can be a parsed {@link Url} object)
 * @param {object} httpOptions  - The `options.resolve.http` object
 * @param {string[]} redirects  - The redirect URLs that have already been followed
 *
 * @returns {Promise<Uint8Array | string>}
 * The promise resolves with the raw downloaded data, or rejects if there is an HTTP error.
 */
async function download (u, httpOptions, redirects) {
  u = url.parse(u);

  redirects.push(u.href);

  const controller = new AbortController();

  /** @type {RequestInit} */
  const init = {
    method: "GET",
    headers: httpOptions.headers || {},
    credentials: httpOptions.withCredentials ? "include" : "omit",
    signal: controller.signal,
    // browser fetch API does not support redirects https://fetch.spec.whatwg.org/#atomic-http-redirect-handling
    redirect: process.browser ? "follow" : httpOptions.redirects === 0 ? "error" : "manual",
  };

  let timeout;
  if (httpOptions.timeout > 0 && isFinite(httpOptions.timeout)) {
    timeout = setTimeout(() => {
      controller.abort();
    }, httpOptions.timeout);
  }

  try {
    /** @type {Response} */
    let res = await fetch(u.href, init);

    if (res.status >= 300 && res.status < 400) {
      if (redirects.length > httpOptions.redirects) {
        throw new ResolverError(ono({ status: res.status },
          `Error downloading ${redirects[0]}. \nToo many redirects: \n  ${redirects.join(" \n  ")}`));
      }

      let location = res.headers.get("Location");
      if (!location) {
        throw new ResolverError(ono({ status: res.status }, `HTTP ${res.status} redirect with no location header`));
      }

      let redirectTo = url.resolve(u, location);
      return await download(redirectTo, httpOptions, redirects);
    }

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return new Uint8Array(await res.arrayBuffer());
  }
  catch (err) {
    if (err instanceof ResolverError) {
      throw err;
    }

    throw new ResolverError(ono(err, `Error downloading ${u.href}`), u.href);
  }
  finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}
