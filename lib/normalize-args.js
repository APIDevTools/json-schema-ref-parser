'use strict';
exports.__esModule = true;
var options_1 = require('./options');
/**
 * Normalizes the given arguments, accounting for optional args.
 *
 * @param {Arguments} args
 * @returns {object}
 */
function normalizeArgs (args) {
  var path;
  var schema;
  var options;
  var callback;
  args = Array.prototype.slice.call(args);
  if (typeof args[args.length - 1] === 'function') {
    // The last parameter is a callback function
    callback = args.pop();
  }
  if (typeof args[0] === 'string') {
    // The first parameter is the path
    path = args[0];
    if (typeof args[2] === 'object') {
      // The second parameter is the schema, and the third parameter is the options
      schema = args[1];
      options = args[2];
    }
    else {
      // The second parameter is the options
      schema = undefined;
      options = args[1];
    }
  }
  else {
    // The first parameter is the schema
    path = '';
    schema = args[0];
    options = args[1];
  }
  if (!(options instanceof options_1.default)) {
    options = new options_1.default(options);
  }
  return {
    path: path,
    schema: schema,
    options: options,
    callback: callback
  };
}
exports.normalizeArgs = normalizeArgs;
