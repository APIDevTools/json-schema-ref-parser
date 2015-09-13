'use strict';

var protocolPattern = /^[a-z0-9.+-]+:\/\//i;

/**
 * Returns the current working directory (in Node) or the current page URL (in browsers).
 *
 * @returns {string}
 */
exports.cwd = function cwd() {
  return process.browser ? location.href : process.cwd() + '/';
};

/**
 * Determines whether the given path is a URL.
 *
 * @param   {string} path
 * @returns {boolean}
 */
exports.isUrl = function isUrl(path) {
  return protocolPattern.test(path);
};

/**
 * Adds a hash to the given path, if it doesn't already have one.
 *
 * @param   {string} path
 * @returns {string}
 */
exports.ensureHash = function ensureHash(path) {
  return path.indexOf('#') === -1 ? path + '#' : path;
};

/**
 * Returns the hash (URL fragment), if any, of the given path.
 *
 * @param   {string} path
 * @returns {string}
 */
exports.getHash = function getHash(path) {
  var hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    return path.substr(hashIndex);
  }
  return '';
};

/**
 * Removes the hash (URL fragment), if any, from the given path.
 *
 * @param   {string} path
 * @returns {string}
 */
exports.stripHash = function stripHash(path) {
  var hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    path = path.substr(0, hashIndex);
  }
  return path;
};

/**
 * Returns the file extension of the given path.
 *
 * @param   {string} path
 * @returns {string}
 */
exports.extname = function extname(path) {
  var lastDot = path.lastIndexOf('.');
  if (lastDot >= 0) {
    return path.substr(lastDot).toLowerCase();
  }
  return '';
};
