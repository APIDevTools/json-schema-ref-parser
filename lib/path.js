'use strict';

var isWindows           = /^win/.test(process.platform),
    forwardSlashPattern = /\//g,
    protocolPattern     = /^([a-z0-9.+-]+):\/\//i;

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
  var protocol = protocolPattern.exec(path);
  if (protocol) {
    protocol = protocol[1].toLowerCase();
    return protocol !== 'file';
  }
  return false;
};

/**
 * If the given path is a local filesystem path, it is converted to a URL.
 *
 * @param {string} path
 * @returns {string}
 */
exports.localPathToUrl = function localPathToUrl(path) {
  if (!process.browser && !exports.isUrl(path)) {
    // Manually encode characters that are not encoded by `encodeURI`
    for (var i = 0; i < urlEncodePatterns.length; i += 2) {
      path = path.replace(urlEncodePatterns[i], urlEncodePatterns[i + 1]);
    }
    path = encodeURI(path);
  }
  return path;
};

/**
 * Converts a URL to a local filesystem path
 *
 * @param {string} url
 * @param {boolean} [keepFileProtocol] - If true, then "file://" will NOT be stripped
 * @returns {string}
 */
exports.urlToLocalPath = function urlToLocalPath(url, keepFileProtocol) {
  // Decode URL-encoded characters
  url = decodeURI(url);

  // Manually decode characters that are not decoded by `decodeURI`
  for (var i = 0; i < urlDecodePatterns.length; i += 2) {
    url = url.replace(urlDecodePatterns[i], urlDecodePatterns[i + 1]);
  }

  // Handle "file://" URLs
  var isFileUrl = url.substr(0, 7).toLowerCase() === 'file://';
  if (isFileUrl) {
    var protocol = 'file:///';

    // Remove the third "/" if there is one
    var path = url[7] === '/' ? url.substr(8) : url.substr(7);

    if (isWindows && path[1] === '/') {
      // insert a colon (":") after the drive letter on Windows
      path = path[0] + ':' + path.substr(1);
    }

    if (keepFileProtocol) {
      url = protocol + path;
    }
    else {
      isFileUrl = false;
      url = isWindows ? path : '/' + path;
    }
  }

  // Format path separators on Windows
  if (isWindows && !isFileUrl) {
    url = url.replace(forwardSlashPattern, '\\');
  }

  return url;
};

/**
 * Returns the hash (URL fragment), of the given path.
 * If there is no hash, then the root hash ("#") is returned.
 *
 * @param   {string} path
 * @returns {string}
 */
exports.getHash = function getHash(path) {
  var hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    return path.substr(hashIndex);
  }
  return '#';
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
