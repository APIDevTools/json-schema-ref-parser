'use strict';

var Options  = require('./options'),
    util     = require('./util'),
    ono      = require('ono'),
    _flatten = require('lodash/array/flatten');

module.exports = $Refs;

/**
 * This class is a map of JSON references and their resolved values.
 */
function $Refs() {
  /**
   * A map of paths/urls to {@link $Ref} objects
   *
   * @type {object}
   * @private
   */
  this._$refs = {};
}

/**
 * Returns the paths of all the files/URLs that are referenced by the JSON schema,
 * including the schema itself.
 *
 * @param {...string|string[]} [types] - Only return paths of the given types ("fs", "http", "https")
 * @returns {string[]}
 */
$Refs.prototype.paths = function(types) {
  var $refs = this._$refs;
  var keys = Object.keys($refs);

  types = _flatten(arguments);
  if (types.length === 0) {
    return keys;
  }

  return keys.filter(function(key) {
    return types.indexOf($refs[key].type) !== -1;
  });
};

/**
 * Returns the map of JSON references and their resolved values.
 *
 * @param {...string|string[]} [types] - Only return references of the given types ("fs", "http", "https")
 * @returns {object}
 */
$Refs.prototype.values = function(types) {
  var $refs = this._$refs;
  var keys = Object.keys($refs);
  types = _flatten(arguments);

  return keys.reduce(function(obj, key) {
    if (types.length === 0 || types.indexOf($refs[key].type) !== -1) {
      obj[key] = $refs[key].value;
    }
  }, {});
};

/**
 * Returns a POJO (plain old JavaScript object) for serialization as JSON.
 *
 * @returns {object}
 */
$Refs.prototype.toJSON = $Refs.prototype.values;

/**
 * Determines whether the given JSON reference has expired.
 * Returns true if the reference does not exist.
 *
 * @param {string} path - The full path being resolved, optionally with a JSON pointer in the hash
 * @returns {boolean}
 */
$Refs.prototype.isExpired = function(path) {
  var $ref = this._get$Ref(path);
  return $ref === undefined || $ref.isExpired();
};

/**
 * Immediately expires the given JSON reference.
 * If the reference does not exist, nothing happens.
 *
 * @param {string} path - The full path being resolved, optionally with a JSON pointer in the hash
 */
$Refs.prototype.expire = function(path) {
  var $ref = this._get$Ref(path);
  if ($ref) {
    $ref.expire();
  }
};

/**
 * Determines whether the given JSON reference exists.
 *
 * @param {string} path - The full path being resolved, optionally with a JSON pointer in the hash
 * @returns {boolean}
 */
$Refs.prototype.exists = function(path) {
  try {
    this._resolve(path);
    return true;
  }
  catch (e) {
    return false;
  }
};

/**
 * Resolves the given JSON reference and returns the resolved value.
 *
 * @param {string} path - The full path being resolved, with a JSON pointer in the hash
 * @param {$RefParserOptions} options
 * @returns {*} - Returns the resolved value
 */
$Refs.prototype.get = function(path, options) {
  return this._resolve(path, options).value;
};

/**
 * Sets the value of a nested property within this {@link $Ref#value}.
 * If the property, or any of its parents don't exist, they will be created.
 *
 * @param {string} path - The full path of the property to set, optionally with a JSON pointer in the hash
 * @param {*} value - The value to assign
 * @param {$RefParserOptions} options
 */
$Refs.prototype.set = function(path, value, options) {
  var withoutHash = util.stripHash(path);
  var $ref = this._$refs[withoutHash];

  if (!$ref) {
    throw ono('Error resolving $ref pointer "%s". \n"%s" not found.', path, withoutHash);
  }

  options = new Options(options);
  $ref.set(path, value, options);
};

/**
 * Resolves the given JSON reference.
 *
 * @param {string} path - The full path being resolved, optionally with a JSON pointer in the hash
 * @param {$RefParserOptions} options
 *
 * @returns {Resolved$Ref}
 * An object providing the resolved value and its resolution path.
 * The resolution path will differ from the `path` param if nested JSON references had to be traversed
 * when resolving the JSON pointer.
 * @protected
 */
$Refs.prototype._resolve = function(path, options) {
  var withoutHash = util.stripHash(path);
  var $refObj = this._$refs[withoutHash];

  if (!$refObj) {
    throw ono('Error resolving $ref pointer "%s". \n"%s" not found.', path, withoutHash);
  }

  options = new Options(options);
  return $refObj.resolve(path, options);
};

/**
 * Returns the specified {@link $Ref} object, or undefined.
 *
 * @param {string} path - The full path being resolved, optionally with a JSON pointer in the hash
 * @returns {$Ref|undefined}
 * @protected
 */
$Refs.prototype._get$Ref = function(path) {
  var withoutHash = util.stripHash(path);
  return this._$refs[withoutHash];
};

/**
 * Adds or updates the specified {@link $Ref} object in the map.
 *
 * @param {$Ref} $ref
 * @protected
 */
$Refs.prototype._set$Ref = function($ref) {
  $ref.$refs = this;
  $ref.path = util.stripHash($ref.path);
  this._$refs[$ref.path] = $ref;
};
