'use strict';

var util         = require('./util'),
    url          = require('url'),
    ono          = require('ono'),
    _isObject    = require('lodash/lang/isObject'),
    _isNumber    = require('lodash/lang/isNumber'),
    _isString    = require('lodash/lang/isString'),
    escapedSlash = /~1/g,
    escapedTilde = /~0/g;

module.exports = $Ref;

/**
 * This class represents a single JSON reference and its resolved value.
 *
 * @param {string} path
 * @constructor
 */
function $Ref(path) {
  /**
   * A reference to the {@link $Refs} object that contains this {@link $Ref} object.
   * @type {$Refs}
   */
  this.$refs = null;

  /**
   * The file path or URL of the referenced file.
   * This path is relative to the path of the main JSON schema file.
   *
   * This path does NOT contain document fragments (JSON pointers). It always references a complete file.
   * Use methods such as {@link $Ref#get}, {@link $Ref#resolve}, and {@link $Ref#exists} to get
   * specific JSON pointers within the file.
   *
   * @type {string}
   */
  this.path = path;

  /**
   * The resolved value of the JSON reference.
   * Can be any JSON type, not just objects. Unknown file types are represented as Buffers (byte arrays).
   * @type {*}
   */
  this.value = undefined;

  /**
   * Indicates the type of {@link $Ref#path} (e.g. "fs", "http", or "https")
   * @type {string}
   */
  this.type = 'pending';

  /**
   * The date/time that the cached value will expire.
   * @type {Date}
   */
  this.expires = undefined;
}

/**
 * Determines whether the {@link $Ref#value} has expired.
 *
 * @returns {boolean}
 */
$Ref.prototype.isExpired = function() {
  return !!(this.expires && this.expires <= new Date());
};

/**
 * Immediately expires the {@link $Ref#value}.
 */
$Ref.prototype.expire = function() {
  this.expires = new Date();
};

/**
 * Sets the {@link $Ref#value} and renews the cache expiration.
 *
 * @param {*} value
 * @param {ParserOptions} options
 */
$Ref.prototype.setValue = function(value, options) {
  this.value = value;

  // Extend the cache expiration
  var cacheDuration = options.cache[this.type];
  if (_isNumber(cacheDuration) && cacheDuration > 0) {
    var expires = Date.now() + (cacheDuration * 1000);
    this.expires = new Date(expires);
  }
};

/**
 * Determines whether the given JSON reference exists within this {@link $Ref#value}.
 *
 * @param {string} path - The full path being resolved, optionally with aJSON pointer in the hash
 * @returns {boolean}
 */
$Ref.prototype.exists = function(path) {
  try {
    this.resolve(path);
    return true;
  }
  catch (e) {
    return false;
  }
};

/**
 * Resolves the given JSON reference within this {@link $Ref#value}.
 *
 * @param {string} path - The full path being resolved, optionally with aJSON pointer in the hash
 * @param {ParserOptions} options
 *
 * @returns {Resolved$Ref}
 * An object providing the resolved value and its resolution path.
 * The resolution path will differ from the `path` param if nested JSON references had to be traversed
 * when resolving the JSON pointer.
 */
$Ref.prototype.resolve = function(path, options) {
  var hash = util.getHash(path);

  /** @typedef {{path: string, value: *}} Resolved$Ref **/
  var prop = {
    path: path,
    value: this.value
  };

  // If there's no hash, then just return the whole value
  if (!hash) {
    return prop;
  }

  // There's a hash, so we need to resolve the JSON pointer
  var props = parseJsonPointer(hash);

  for (var i = 0; i < props.length; i++) {
    resolveValue(prop, this.$refs, options);

    if (props[i] in prop.value) {
      prop.value = prop.value[props[i]];
    }
    else {
      throw ono.syntax('Error resolving $ref pointer "%s". \n"%s" not found.', path, hash);
    }
  }

  return resolveValue(prop, this.$refs, options);
};

/**
 * Resolves the given JSON reference within this {@link $Ref#value} and returns the resolved value.
 *
 * @param {string} path - The full path being resolved, optionally with aJSON pointer in the hash
 * @param {ParserOptions} options
 * @returns {*} - Returns the resolved value
 */
$Ref.prototype.get = function(path, options) {
  return this.resolve(path, options).value;
};

/**
 * Sets the value of a nested property within this {@link $Ref#value}.
 * If the property, or any of its parents don't exist, they will be created.
 *
 * @param {string} path - The full path of the property to set, optionally with aJSON pointer in the hash
 * @param {*} value - The value to assign
 * @param {ParserOptions} options
 */
$Ref.prototype.set = function(path, value, options) {
  var hash = util.getHash(path);

  // If there's no hash, then just set the whole value
  if (!hash) {
    this.value = value;
    return;
  }

  // There's a hash, so we need to resolve the JSON pointer
  var props = parseJsonPointer(hash);
  var prop = {
    path: path,
    value: this.value
  };

  try {
    for (var i = 0; i < props.length - 1; i++) {
      resolveValue(prop, this.$refs, options);

      if (props[i] in prop.value) {
        prop.value = prop.value[props[i]];
      }
      else {
        prop.value = prop.value[props[i]] = {};
      }
    }

    resolveValue(prop, this.$refs, options);
    prop.value[props[props.length - 1]] = value;
  }
  catch (e) {
    throw ono.syntax(e,
      'Error resolving $ref pointer "%s". \n"%s" not found.', path, hash);
  }
};

/**
 * Determines whether the given value is a JSON reference, and whether it is allowed by the options.
 * For example, if it references an external file, then options.$refs.external must be true.
 *
 * @param {*} value - The value to inspect
 * @param {ParserOptions} options
 * @returns {boolean}
 */
$Ref.isAllowed = function(value, options) {
  if (value && _isObject(value) && _isString(value.$ref)) {
    if (value.$ref[0] === '#') {
      if (options.$refs.internal) {
        return true;
      }
    }
    else if (options.$refs.external) {
      return true;
    }
  }
};

/**
 * Parses the given JSON pointer according to RFC 6901
 *
 * {@link https://tools.ietf.org/html/rfc6901#section-3}
 *
 * @param {string} hash
 * - A hash (URL fragment) containing a JSON pointer. Any leading "#" is ignored.
 *
 * @returns {string[]}
 * Each element of the returned array is a segment of the JSON pointer.
 * (e.g. "#/definitions/person/name" => ["definitions", "person", "name"])
 */
function parseJsonPointer(hash) {
  // Remove the leading hash if it exists
  hash = hash[0] === '#' ? hash.substr(1) : hash;

  // Split into an array
  hash = hash.split('/');

  // Decode each part, according to RFC 6901
  for (var i = 0; i < hash.length; i++) {
    hash[i] = hash[i].replace(escapedSlash, '/').replace(escapedTilde, '~');
  }

  if (hash[0] !== '') {
    throw ono.syntax('Invalid $ref pointer "%s". Pointers must begin with "#/"', hash);
  }

  return hash.slice(1);
}

/**
 * If the given property value is a JSON reference, then resolve its value;
 * otherwise, just return the existing value.
 *
 * @param {Resolved$Ref} prop - The current value and resolution path
 * @param {$Refs} $refs
 * @param {ParserOptions} [options]
 *
 * @returns {Resolved$Ref}
 * If `prop` is NOT a JSON reference, then it is returned as-is.
 * Otherwise, it is returned with {@link Resolved$Ref#value} set to the resolved value
 * and {@link Resolved$Ref#path} set to the resolution path of that value.
 */
function resolveValue(prop, $refs, options) {
  // Determine if the property value is a JSON reference
  if ($Ref.isAllowed(prop.value, options)) {
    // It IS a JSON reference, so we need to resolve it
    var $refString = url.resolve(prop.path, prop.value.$ref);

    // Don't resolve circular references
    if ($refString !== prop.path) {
      prop.path = $refString;
      prop.value = $refs.get($refString);
    }
  }
  return prop;
}
