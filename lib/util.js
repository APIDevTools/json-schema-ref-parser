'use strict';

var debug           = require('debug'),
    _isFunction     = require('lodash/lang/isFunction'),
    protocolPattern = /^[a-z0-9.+-]+:\/\//i;

module.exports = {
  /**
   * Writes messages to stdout.
   * Log messages are suppressed by default, but can be enabled by setting the DEBUG variable.
   * @type {function}
   */
  debug: debug('json-schema-ref-parser'),
  cwd: cwd,
  isUrl: isUrl,
  getHash: getHash,
  stripHash: stripHash,
  extname: extname,
  doCallback: doCallback
};

/**
 * Returns the current working directory (in Node) or the current page URL (in browsers).
 *
 * @returns {string}
 */
function cwd() {
  return process.browser ? location.href : process.cwd() + '/';
}

/**
 * Determines whether the given path is a URL.
 *
 * @param   {string} path
 * @returns {boolean}
 */
function isUrl(path) {
  return protocolPattern.test(path);
}

/**
 * Returns the hash (URL fragment), if any, of the given path.
 *
 * @param   {string} path
 * @returns {string}
 */
function getHash(path) {
  var hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    return path.substr(hashIndex);
  }
  return '';
}

/**
 * Removes the hash (URL fragment), if any, from the given path.
 *
 * @param   {string} path
 * @returns {string}
 */
function stripHash(path) {
  var hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    path = path.substr(0, hashIndex);
  }
  return path;
}

/**
 * Returns the file extension of the given path.
 *
 * @param   {string} path
 * @returns {string}
 */
function extname(path) {
  var lastDot = path.lastIndexOf('.');
  if (lastDot >= 0) {
    return path.substr(lastDot).toLowerCase();
  }
  return '';
}

/**
 * Asynchronously invokes the given callback function with the given parameters.
 *
 * @param {function|undefined} callback
 * @param {*}       [err]
 * @param {...*}    [params]
 */
function doCallback(callback, err, params) {
  if (_isFunction(callback)) {
    var args = Array.prototype.slice.call(arguments, 1);

    /* istanbul ignore if: code-coverage doesn't run in the browser */
    if (process.browser) {
      process.nextTick(invokeCallback);
    }
    else {
      setImmediate(invokeCallback);
    }
  }

  function invokeCallback() {
    callback.apply(null, args);
  }
}
