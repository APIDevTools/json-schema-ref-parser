'use strict';

var fs = require('fs');
var ono = require('ono');
var Promise = require('../util/promise');
var debug = require('../util/debug');

var isWindows = /^win/.test(process.platform);
var forwardSlashPattern = /\//g;
var protocolPattern = /^([a-z0-9.+-]+):\/\//i;

// RegExp patterns to URL-decode special characters for local filesystem paths
var urlDecodePatterns = [
  /\%23/g, '#',
  /\%24/g, '$',
  /\%26/g, '&',
  /\%2C/g, ',',
  /\%40/g, '@'
];

module.exports = {
  /**
   * The order that this reader will run, in relation to other readers.
   *
   * @type {number}
   */
  order: 100,

  /**
   * Determines whether this reader can read a given file.
   * Readers that return true will be tried in order, until one successfully reads the file.
   * Readers that return false will not be given a chance to read the file.
   *
   * @param {File} file - A {@link File} object containing the URL to be read
   * @returns {boolean}
   */
  canRead: function isFile(file) {
    if (process.browser) {
      // We're running in a browser, so local files aren't supported
      return false;
    }

    // Does the file URL have a protocol (e.g. "http", "file", etc.)?
    var protocol = protocolPattern.exec(file.url);
    if (!protocol) {
      // There's no protocol, and we're NOT running in a browser,
      // so assume this is a local filesystem path.
      // (e.g. "C:\Windows\..." or "/usr/local/...")
      return true;
    }

    if (protocol[1].toLowerCase() === 'file') {
      // It's a "file://" URL, which we can convert to a local filesystem path
      return true;
    }
  },

  /**
   * Reads the given file and returns its raw contents as a Buffer.
   *
   * @param {File} file - A {@link File} object containing the data to be parsed
   * @returns {Promise<Buffer>}
   */
  read: function readFile(file) {
    return new Promise(function(resolve, reject) {
      try {
        // Decode and convert the URL to a local filesystem path
        file.path = convertUrlToFilePath(file.url);
      }
      catch (err) {
        reject(ono.uri(err, 'Malformed URI: %s', file.url));
      }

      debug('Opening file: %s', file.path);

      try {
        fs.readFile(file.path, function(err, data) {
          if (err) {
            reject(ono(err, 'Error opening file "%s"', file.path));
          }
          else {
            resolve(data);
          }
        });
      }
      catch (err) {
        reject(ono(err, 'Error opening file "%s"', file.path));
      }
    });
  }
};

/**
 * Converts a URL to a local filesystem path.
 * This includes decoding URL-encoded characters (e.g. %20, %26, etc.)
 * and converting from the "file://" protocol to an absolute path.
 *
 * @param {string} url
 * @returns {string}
 */
function convertUrlToFilePath(url) {
  // Decode URL-encoded characters
  url = decodeFileURI(url);

  // Strip-off the "file://" protocol
  url = stripFileProtocol(url);

  // On Windows, convert forward slashes to backslashes
  if (isWindows) {
    url = url.replace(forwardSlashPattern, '\\');
  }

  return url;
}

/**
 * Decodes URL-encoded escape sequences, such as %20, %26, etc.
 *
 * @param {string} url
 * @returns {string}
 */
function decodeFileURI(url) {
  // `decodeURI` will ONLY decode characters that are encoded by `encodeURI`
  url = decodeURI(url);

  // We also need to decode characters that are not decoded by `decodeURI`.
  // This includes characters such as "#" and "?", which have special meaning in URLs,
  // but are just normal characters in a filesystem path.
  for (var i = 0; i < urlDecodePatterns.length; i += 2) {
    var encoded = urlDecodePatterns[i];
    var decoded = urlDecodePatterns[i + 1];
    url = url.replace(encoded, decoded);
  }

  return url;
}

/**
 * Removes the "file://" protocol from the given URL,
 * resulting in an absolute filesystem path
 *
 * @param {string} url
 * @returns {string}
 */
function stripFileProtocol(url) {
  var isFileUrl = url.substr(0, 7).toLowerCase() === 'file://';
  if (isFileUrl) {
    // Strip-off the protocol, and the initial "/", if there is one
    url = url[7] === '/' ? url.substr(8) : url.substr(7);

    if (isWindows) {
      // Insert a colon (":") after the drive letter, if necessary
      if (url[1] === '/') {
        url = url[0] + ':' + url.substr(1);
      }
    }
    else {
      // It's a Posix path, so start at root
      url = '/' + url;
    }
  }

  return url;
}
