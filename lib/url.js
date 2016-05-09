'use strict';

var isWindows = /^win/.test(process.platform);
var URL = module.exports;

var hasProtocol = /^[a-z0-9.+-]+:\/\//i;
var backslashPattern = /\\/g;

// RegExp patterns to URL-encode special characters in local filesystem paths
var urlEncodePatterns = [
  /\?/g, '%3F',
  /\#/g, '%23',
];

exports.resolve = require('url').resolve;

/**
 * Returns the current working directory (in Node) or the current page URL (in browsers).
 *
 * @returns {string}
 */
exports.cwd = function cwd() {
  if (process.browser) {
    return location.href;
  }
  else {
    return URL.autoEncode(process.cwd()) + '/';
  }
};

/**
 * Returns the lowercased file extension of the given URL,
 * or an empty string if it has no extension.
 *
 * @param   {string} url
 * @returns {string}
 */
exports.getExtension = function getExtension(url) {
  var lastDot = url.lastIndexOf('.');
  if (lastDot >= 0) {
    return url.substr(lastDot).toLowerCase();
  }
  return '';
};

/**
 * Returns the hash (URL fragment), of the given url.
 * If there is no hash, then the root hash ("#") is returned.
 *
 * @param   {string} url
 * @returns {string}
 */
exports.getHash = function getHash(url) {
  var hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    return url.substr(hashIndex);
  }
  return '#';
};

/**
 * Removes the hash (URL fragment), if any, from the given url.
 *
 * @param   {string} url
 * @returns {string}
 */
exports.stripHash = function stripHash(url) {
  var hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    url = url.substr(0, hashIndex);
  }
  return url;
};

/**
 * URL-encodes local filesystem paths, escaping characters such as "#" and "?",
 * which have special meaning in URLs, and characters such as "\" which have special
 * meaning in some filesystems (Windows).
 *
 * This method only applies to Node.js. When running in a web browser, all user-input
 * is expected to already be properly URL-encoded.  But when running in Node.js, it is
 * typically expected that users should be able to pass-in raw filesystem paths rather
 * than URLs. This is just an ease-of-use feature, rather than requiring users to convert
 * all paths to encoded URLs before calling our API.
 *
 * NOTE: This method should ONLY be used in public API methods that expect the user to pass-in
 * the path of an ENTIRE file, such as {@link $RefParser#parse}, {@link FileArray#get}, etc.
 * DO NOT use this method in APIs that allow the user to pass-in a JSON Reference or JSON Pointer,
 * as that would cause ambiguous behavior around characters such as "#" and "\".
 * Users MUST pass properly-encoded URLs to those methods, as that's the only way to unambiguously
 * determine their intent.
 *
 * This method SHOULD NOT be used internally within the API, including when parsing or resolving
 * JSON References in files, as that leads to the same ambiguity mentioned above.
 *
 * @example
 * The following filesystem paths would be converted to the following URLs:
 *
 *    <"!@#$%^&*+=?'>.json              ==>   %3C%22!@%23$%25%5E&*+=%3F\'%3E.json
 *    C:\\My Documents\\File (1).json   ==>   C:/My%20Documents/File%20(1).json
 *    /Project #42/file.json            ==>   /Project%20%2342/file.json
 *
 * @param {string} url
 * @returns {string}
 */
exports.autoEncode = function autoEncode(url) {
  // Determine whether `url` is a URL or a filesystem path.
  // If it's a URL, then it should already be encoded. No need to encode it ourselves.
  // NOTE: When running in a browser, ALL paths are treated as URLs
  if (process.browser || hasProtocol.test(url)) {
    return url;
  }

  // On Windows, convert backslashes to forward slashes.
  // On Posix, backslashes are valid characters in file names, and will be URL-encoded as %5C
  if (isWindows) {
    url = url.replace(backslashPattern, '/');
  }

  // `encodeURI` will encode most characters
  url = encodeURI(url);

  // There are a few characters that are not encoded by `encodeURI` because they have special
  // meaning in URLs (such as "#" and "?") but are just normal characters in a filesystem path.
  for (var i = 0; i < urlEncodePatterns.length; i += 2) {
    var decoded = urlEncodePatterns[i];
    var encoded = urlEncodePatterns[i + 1];
    url = url.replace(decoded, encoded);
  }

  return url;
};
