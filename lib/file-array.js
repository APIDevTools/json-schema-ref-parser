/* eslint no-invalid-this:0 */
'use strict';

var ono = require('ono');
var URL = require('./url');

module.exports = FileArray;

/**
 * An array of {@link File} objects, with some helper methods.
 *
 * @returns {array}
 */
function FileArray() {
  var files = [];

  /**
   * Determines whether a given file is in the array.
   *
   * @param {string} url - An absolute or relative file path or URL
   * @returns {boolean}
   */
  files.exists = function exists(url) {
    return FileArray.exists(this, url, true);
  };

  /**
   * Returns the given file in the array. Throws an error if not found.
   *
   * @param {string} url - An absolute or relative file path or URL
   * @returns {File}
   */
  files.get = function get(url) {
    return FileArray.get(this, url, true);
  };

  return files;
}

/**
 * Determines whether a given file is in the array.
 *
 * @param {File[]} files - The FileArray to search
 * @param {string} url - An absolute or relative file path or URL
 * @param {boolean} normalize - Whether `url` should be normalized before searching the array
 * @returns {boolean}
 */
FileArray.exists = function exists(files, url, normalize) {
  if (files.length === 0) {
    return false;
  }
  if (normalize) {
    url = normalizeUrl(files[0].url, url);
  }
  return !!findFile(files, url);
};

/**
 * Returns the given file in the array. Throws an error if not found.
 *
 * @param {File[]} files - The FileArray to search
 * @param {string} url - An absolute or relative file path or URL
 * @param {boolean} normalize - Whether `url` should be normalized before searching the array
 * @returns {File}
 */
FileArray.get = function get(files, url, normalize) {
  if (files.length === 0) {
    throw ono('Error resolving "%s". \nThe schema is empty.', url);
  }

  var fileUrl = normalize ? normalizeUrl(files[0].url, url) : url;
  var file = findFile(files, fileUrl);

  if (!file) {
    throw ono('Error resolving "%s". \nThe file (%s) was not found in the schema.', url, fileUrl);
  }
  return file;
};

/**
 * Given an absolute URL, returns the corresponding {@link File} object, if found.
 *
 * @param {File[]} files
 * @param {string} url
 * @returns {File}
 */
function findFile(files, url) {
  for (var i = 0; i < files.length; i++) {
    if (files[i].url === url) {
      return files[i];
    }
  }
}

/**
 * Normalizes a user-input file path or URL, and returns an absolute, encoded file URL.
 *
 * @param {string} baseUrl - The base URL to use if `url` is relative
 * @param {string} url - The file path or URL to be normalized
 * @returns {string}
 */
function normalizeUrl(baseUrl, url) {
  // Make sure the URL is properly encoded
  url = URL.autoEncode(url);

  // Remove any URL fragment (hash)
  var withoutHash = URL.stripHash(url);

  // Resolve the URL, relative to the main JSON Schema file
  return URL.resolve(baseUrl, withoutHash);
}
