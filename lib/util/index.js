'use strict';

var debug = require('debug'),
    path  = require('./path');

/**
 * Writes messages to stdout.
 * Log messages are suppressed by default, but can be enabled by setting the DEBUG variable.
 * @type {function}
 */
exports.debug = debug('json-schema-ref-parser');

/**
 * Utility functions for working with file paths and URLs
 */
exports.path = path;

/**
 * Runs user-defined functions in order.
 *
 * @param {object} obj - An object with function properties. Each function can have an `order` property.
 * @param {function} callback - A callback to execute for each function in `obj`
 */
exports.runInOrder = function(obj, callback) {
  Object.keys(obj)
    .map(function(key) { return {key: key, fn: obj[key]}; })
    .filter(function(value) { return typeof value.fn === 'function'; })
    .sort(function(a, b) { return a.fn.order - b.fn.order; })
    .some(function(value) {
      return callback(value.key, value.fn);
    });
};
