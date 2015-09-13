'use strict';

var debug = require('debug');

exports.path = require('./path');

/**
 * Writes messages to stdout.
 * Log messages are suppressed by default, but can be enabled by setting the DEBUG variable.
 * @type {function}
 */
exports.debug = debug('json-schema-ref-parser');

/**
 * Asynchronously invokes the given callback function with the given parameters.
 *
 * @param {function|undefined} callback
 * @param {*}       [err]
 * @param {...*}    [params]
 */
exports.doCallback = function doCallback(callback, err, params) {
  if (typeof(callback) === 'function') {
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
};
