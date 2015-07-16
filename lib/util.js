'use strict';

var debug       = require('debug'),
    format      = require('util').format,
    _isFunction = require('lodash/lang/isFunction'),
    _isString   = require('lodash/lang/isString'),
    slice       = Array.prototype.slice;

module.exports = {
  /**
   * Writes messages to stdout.
   * Log messages are suppressed by default, but can be enabled by setting the DEBUG variable.
   * @type {function}
   */
  debug: debug('json-schema-ref-parser'),
  doCallback: doCallback,
  newError: newError
};

/**
 * Asynchronously invokes the given callback function with the given parameters.
 *
 * @param {function|undefined} callback
 * @param {*}       [err]
 * @param {...*}    [params]
 */
function doCallback(callback, err, params) {
  if (_isFunction(callback)) {
    var args = slice.call(arguments, 1);

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

/**
 * Creates an Error with a formatted string message.
 *
 * @param     {Class}     [Klass]     The error class to create (default is {@link Error})
 * @param     {Error}     [err]       The original error, if any
 * @param     {string}    [message]   A user-friendly message about the source of the error
 * @param     {...*}      [params]    One or more {@link util#format} params
 * @returns   {Error}
 */
function newError(Klass, err, message, params) {
  if (_isFunction(Klass) && err instanceof Error) {
    return makeError(Klass, err, format.apply(null, slice.call(arguments, 2)));
  }
  else if (_isFunction(Klass)) {
    return makeError(Klass, null, format.apply(null, slice.call(arguments, 1)));
  }
  else if (err instanceof Error) {
    return makeError(Error, err, format.apply(null, slice.call(arguments, 1)));
  }
  else {
    return makeError(Error, null, format.apply(null, arguments));
  }
}

/**
 * Creates a new error that wraps another error.
 *
 * @param   {Class}         Klass       The Error class to create
 * @param   {Error|null}    err         The inner Error object, if any
 * @param   {string}        message     Optional message about where and why the error occurred.
 */
function makeError(Klass, err, message) {
  if (err) {
    // Append inner error information to the message
    message += ' \n' + (err.name || 'Error') + ': ' + err.message;
  }

  var newErr = new Klass(message);

  /* istanbul ignore else: Only IE doesn't have an Error.stack property */
  if (err && _isString(err.stack)) {
    // Keep the stack trace of the original error
    newErr.stack += ' \n\n' + err.stack;
  }

  return newErr;
}
