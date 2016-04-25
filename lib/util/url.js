'use strict';

var isWindows = /^win/.test(process.platform);
var forwardSlashPattern = /\//g;
var protocolPattern = /^([a-z0-9.+-]+):\/\//i;
var URL = module.exports;

// RegExp patterns to URL-encode special characters in local filesystem paths
var urlEncodePatterns = [
  /\?/g, '%3F',
  /\#/g, '%23',
  isWindows ? /\\/g : /\//, '/'
];

// RegExp patterns to URL-decode special characters for local filesystem paths
var urlDecodePatterns = [
  /\%23/g, '#',
  /\%24/g, '$',
  /\%26/g, '&',
  /\%2C/g, ',',
  /\%40/g, '@'
];

exports.parse = require('url').parse;
exports.resolve = require('url').resolve;

/**
 * Returns the current working directory (in Node) or the current page URL (in browsers).
 *
 * @returns {string}
 */
exports.cwd = function cwd() {
  return process.browser ? location.href : process.cwd() + '/';
};

/**
 * Returns the protocol of the given URL, or `undefined` if it has no protocol.
 *
 * @param   {string} url
 * @returns {?string}
 */
exports.getProtocol = function getProtocol(url) {
  var match = protocolPattern.exec(url);
  if (match) {
    return match[1].toLowerCase();
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
 * Determines whether the given url is an HTTP(S) URL.
 *
 * @param   {string} url
 * @returns {boolean}
 */
exports.isHttp = function isHttp(url) {
  var protocol = URL.getProtocol(url);
  if (protocol === 'http' || protocol === 'https') {
    return true;
  }
  else if (protocol === undefined) {
    // There is no protocol.  If we're running in a browser, then assume it's HTTP.
    return process.browser;
  }
  else {
    // It's some other protocol, such as "ftp://", "mongodb://", etc.
    return false;
  }
};

/**
 * Determines whether the given url is a filesystem path.
 * This includes "file://" URLs.
 *
 * @param   {string} url
 * @returns {boolean}
 */
exports.isFileSystemPath = function isFileSystemPath(url) {
  if (process.browser) {
    // We're running in a browser, so assume that all paths are URLs.
    // This way, even relative paths will be treated as URLs rather than as filesystem paths
    return false;
  }

  var protocol = URL.getProtocol(url);
  return protocol === undefined || protocol === 'file';
};

/**
 * Converts a filesystem path to a properly-encoded URL.
 *
 * This is intended to handle situations where JSON Schema $Ref Parser is called
 * with a filesystem path that contains characters which are not allowed in URLs.
 *
 * @example
 * The following filesystem paths would be converted to the following URLs:
 *
 *    <"!@#$%^&*+=?'>.json              ==>   %3C%22!@%23$%25%5E&*+=%3F\'%3E.json
 *    C:\\My Documents\\File (1).json   ==>   C:/My%20Documents/File%20(1).json
 *    file://Project #42/file.json      ==>   file://Project%20%2342/file.json
 *
 * @param {string} path
 * @returns {string}
 */
exports.fromFileSystemPath = function fromFileSystemPath(path) {
  // Step 1: Manually encode characters that are not encoded by `encodeURI`.
  // This includes characters such as "#" and "?", which have special meaning in URLs,
  // but are just normal characters in a filesystem path.
  // On Windows, this will also replace backslashes with forward slashes,
  // rather than encoding them as special characters.
  for (var i = 0; i < urlEncodePatterns.length; i += 2) {
    path = path.replace(urlEncodePatterns[i], urlEncodePatterns[i + 1]);
  }

  // Step 2: `encodeURI` will take care of all other characters
  return encodeURI(path);
};

/**
 * Converts a URL to a local filesystem path.
 *
 * @param {string}  url
 * @returns {string}
 */
exports.toFileSystemPath = function toFileSystemPath(url) {
  // Step 1: `decodeURI` will decode characters such as Cyrillic characters, spaces, etc.
  url = decodeURI(url);

  // Step 2: Manually decode characters that are not decoded by `decodeURI`.
  // This includes characters such as "#" and "?", which have special meaning in URLs,
  // but are just normal characters in a filesystem path.
  for (var i = 0; i < urlDecodePatterns.length; i += 2) {
    url = url.replace(urlDecodePatterns[i], urlDecodePatterns[i + 1]);
  }

  // Step 3: If it's a "file://" URL, then format it consistently
  // or convert it to a local filesystem path
  var isFileUrl = url.substr(0, 7).toLowerCase() === 'file://';
  if (isFileUrl) {
    // Strip-off the protocol, and the initial "/", if there is one
    url = url[7] === '/' ? url.substr(8) : url.substr(7);

    // insert a colon (":") after the drive letter on Windows
    if (isWindows && url[1] === '/') {
      url = url[0] + ':' + url.substr(1);
    }

    // Convert the "file://" URL to a local filesystem path.
    // On Windows, it will start with something like "C:/".
    // On Posix, it will start with "/"
    isFileUrl = false;
    url = isWindows ? url : '/' + url;
  }

  // Step 4: On Windows, convert backslashes to forward slashes,
  // unless it's a "file://" URL
  if (isWindows && !isFileUrl) {
    url = url.replace(forwardSlashPattern, '\\');
  }

  return url;
};
