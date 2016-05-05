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
  files.exists = fileExists;
  files.get = getFile;
  return files;
}

/**
 * Determines whether a given file is in the array.
 *
 * @param {string} url - An absolute or relative URL. It can contain a hash, but that will be ignored,
 *                       since we're checking for the existence of the complete file, not a part of it.
 *
 * @returns {boolean}
 */
function fileExists(url) {
  if (this.length === 0) {
    return false;
  }
  var fileUrl = getFileUrl(this, url);
  return !!findFile(this, fileUrl);
}

/**
 * Returns the given file in the array, if it exists.
 *
 * @param {string} url - An absolute or relative URL. It can contain a hash, but that will be ignored,
 *                       since we're searching for the complete file, not a part of it.
 *
 * @returns {File|undefined}
 */
function getFile(url) {
  if (this.length === 0) {
    throw ono('Error resolving "%s". \nThe schema is empty.', url);
  }

  var fileUrl = getFileUrl(this, url);
  var file = findFile(this, fileUrl);
  if (!file) {
    throw ono('Error resolving "%s". \nThe file (%s) was not found in the schema.', url, fileUrl);
  }
  return file;
}

/**
 * Given a relative or absolute URL, this function returns an absolute file URL.
 * Any url fragment is removed, so the returned URL references the complete file, not part of it.
 *
 * @param {File[]} files
 * @param {string} url
 * @returns {string}
 */
function getFileUrl(files, url) {
  var withoutHash = URL.stripHash(url);
  return URL.resolve(files[0].url, withoutHash);
}

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
