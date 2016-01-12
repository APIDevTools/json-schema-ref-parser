'use strict';

var debug   = require('debug'),
    Promise = require('../util/promise'),
    path    = require('./path'),
    util    = exports;

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
exports.getOrderedFunctions = function(obj) {
  return Object.keys(obj)
    .map(function(key) {
      return {
        order: obj[key].order || Number.MAX_SAFE_INTEGER,
        name: key || 'UNKNOWN',
        fn: obj[key]
      };
    })
    .filter(function(value) { return typeof value.fn === 'function'; })
    .sort(function(a, b) { return a.order - b.order; });
};

/**
 * Runs the given user-defined functions in order, until one of them returns a successful result.
 * Each function can return a Promise or call an error-first callback.
 * If the promise resolves successfully, or the callback is called without an error, then the result
 * is immediately returned and no further functions are called.
 * If the promise rejects, or the callback is called with an error, then the next function is called.
 * If ALL functions fail, then the last error is thrown.
 *
 * @param {{order: number, name: string, fn: function}[]} funcs - The results of {@link util.getOrderedFunctions}
 * @param {...*} [args] - One or more arguments to pass to each function
 * @returns {Promise}
 */
exports.runOrderedFunctions = function(funcs, args) {
  var func, lastError, index = 0;
  args = Array.prototype.slice.call(arguments, 1);

  return new Promise(function(resolve, reject) {
    args.push(callback);
    runNextFunction();

    function runNextFunction() {
      func = funcs[index++];
      if (!func) {
        // There are no more functions, so re-throw the last error
        return reject(lastError);
      }

      try {
        util.debug('  %s', func.name);
        var promise = func.fn.apply(null, args);
        if (promise) {
          promise.then(onSuccess, onError);
        }
      }
      catch (e) {
        onError(e);
      }
    }

    function callback(err, result) {
      if (err) {
        onError(err);
      }
      else {
        onSuccess(result);
      }
    }

    function onSuccess(result) {
      util.debug('    success');
      resolve({
        order: func.order,
        name: func.name,
        fn: func.fn,
        result: result
      });
    }

    function onError(err) {
      util.debug('    %s', err.message || err);
      lastError = err;
      runNextFunction();
    }
  });
};
