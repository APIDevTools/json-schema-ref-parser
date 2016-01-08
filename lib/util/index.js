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
 * A poor-man's `function.bind()`, for browsers that don't support it
 *
 * @param {function} func
 * @param {*} [context]
 * @returns {function}
 */
exports.bind = function(func, context) {
  return function() {
    return func.apply(context, arguments);
  };
};

/**
 * Returns an array of user-defined functions, sorted by their `order` property.
 *
 * @param {object} obj - An object with function properties. Each function can have an `order` property.
 * @returns {{order: number, name: string, fn: function}[]}
 */
exports.orderedFunctions = function(obj) {
  return Object.keys(obj)
    .map(function(key) { return {order: obj[key].order, name: key, fn: obj[key]}; })
    .filter(function(value) { return typeof value.fn === 'function'; })
    .sort(function(a, b) { return a.order - b.order; });
};
