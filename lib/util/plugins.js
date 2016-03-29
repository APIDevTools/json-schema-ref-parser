'use strict';

var Promise = require('./promise'),
    debug   = require('./debug');

/**
 * Returns the given plugins as an array, rather than an object map.
 * All other methods in this module expect an array of plugins rather than an object map.
 *
 * @param  {object} plugins - A map of plugin objects
 * @return {object[]}
 */
exports.all = function(plugins) {
  return Object.keys(plugins)
    .filter(function(key) {
      return typeof plugins[key] === 'object';
    })
    .map(function(key) {
      plugins[key].name = key;
      return plugins[key];
    });
};

/**
 * Filters the given plugins, returning only the ones return `true` for the given method.
 *
 * @param  {object[]} plugins - An array of plugin objects
 * @param  {string}   method  - The name of the filter method to invoke for each plugin
 * @param  {...*}     [args]  - The arguments to pass to each method call
 * @return {object[]}
 */
exports.filter = function(plugins, method, args) {
  args = Array.prototype.slice.call(arguments, 2);

  return plugins
    .filter(function(plugin) {
      return typeof plugin[method] === 'function' && plugin[method].apply(plugin, args);
    });
};

/**
 * Sorts the given plugins, in place, by their `order` property.
 *
 * @param {object[]} plugins - An array of plugin objects
 * @returns {object[]}
 */
exports.sort = function(plugins) {
  return plugins
    .forEach(function(plugin) {
      plugin.order = plugin.order || Number.MAX_SAFE_INTEGER;
    })
    .sort(function(a, b) { return a.order - b.order; });
};

/**
 * Runs the specified method of the given plugins, in order, until one of them returns a successful result.
 * Each method can return a synchronous value, a Promise, or call an error-first callback.
 * If the promise resolves successfully, or the callback is called without an error, then the result
 * is immediately returned and no further plugins are called.
 * If the promise rejects, or the callback is called with an error, then the next plugin is called.
 * If ALL plugins fail, then the last error is thrown.
 *
 * @param {object[]}  plugins - An array of plugin objects
 * @param {string}    method  - The name of the method to invoke for each plugin
 * @param {...*}      [args]  - One or more arguments to pass to each method
 * @returns {Promise}
 */
exports.run = function(plugins, method, args) {
  var plugin, lastError, index = 0;
  args = Array.prototype.slice.call(arguments, 2);

  return new Promise(function(resolve, reject) {
    args.push(callback);
    runNextPlugin();

    function runNextPlugin() {
      plugin = plugins[index++];
      if (!plugin) {
        // There are no more functions, so re-throw the last error
        return reject(lastError);
      }

      try {
        debug('  %s', plugin.name);
        var result = plugin[method].apply(plugin, args);
        if (result && typeof result.then === 'function') {
          // A promise was returned
          result.then(onSuccess, onError);
        }
        else if (result !== undefined) {
          // A synchronous result was returned
          onSuccess(result);
        }
        // else { the callback will be called }
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
      debug('    success');
      resolve({
        plugin: plugin,
        result: result
      });
    }

    function onError(err) {
      debug('    %s', err.message || err);
      lastError = err;
      runNextPlugin();
    }
  });
};
