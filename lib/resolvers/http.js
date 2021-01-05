"use strict";

const fetch = require("node-fetch").default;
const { ono } = require("@jsdevtools/ono");
const url = require("../util/url");
const { ResolverError } = require("../util/errors");

module.exports = {
  /**
   * fetch RequestInit defintion
   *
   * @type {RequestInit} request init
   */
  requestInit: {
    method: "GET",
    redirect: 5,
    timeout: 5000
  },

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

    if (process.browser && !u.protocol) {
      // Use the protocol of the current page
      u.protocol = url.parse(location.href).protocol;
    }

    return fetch(url.format(u), this.requestInit)
      .then((response) => response.buffer())
      .catch((err) => new ResolverError(ono(err, `Error downloading ${u.href}`), u.href));
  }
};
