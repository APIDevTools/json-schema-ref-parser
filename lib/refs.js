'use strict';

var ono = require('ono'),
    $Ref = require('./ref'),
    url = require('./util/url');

module.exports = $Refs;

/**
 * This class is a map of JSON references and their resolved values.
 */
function $Refs () {
  /**
   * Indicates whether the schema contains any circular references.
   *
   * @type {boolean}
   */
  this.circular = false;

  /**
   * A map of paths/urls to {@link $Ref} objects
   *
   * @type {object}
   * @protected
   */
  this._$refs = {};

  /**
   * The {@link $Ref} object that is the root of the JSON schema.
   *
   * @type {$Ref}
   * @protected
   */
  this._root$Ref = null;
}

/**
 * Returns the paths of all the files/URLs that are referenced by the JSON schema,
 * including the schema itself.
 *
 * @param {...string|string[]} [types] - Only return paths of the given types ("file", "http", etc.)
 * @returns {string[]}
 */
$Refs.prototype.paths = function (types) {
  var paths = getPaths(this._$refs, arguments);
  return paths.map(function (path) {
    return path.decoded;
  });
};

/**
 * Returns the map of JSON references and their resolved values.
 *
 * @param {...string|string[]} [types] - Only return references of the given types ("file", "http", etc.)
 * @returns {object}
 */
$Refs.prototype.values = function (types) {
  var $refs = this._$refs;
  var paths = getPaths($refs, arguments);
  return paths.reduce(function (obj, path) {
    obj[path.decoded] = $refs[path.encoded].value;
    return obj;
  }, {});
};

/**
 * Returns a POJO (plain old JavaScript object) for serialization as JSON.
 *
 * @returns {object}
 */
$Refs.prototype.toJSON = $Refs.prototype.values;

/**
 * Determines whether the given JSON reference exists.
 *
 * @param {string} path - The path being resolved, optionally with a JSON pointer in the hash
 * @param {$RefParserOptions} [options]
 * @returns {boolean}
 */
$Refs.prototype.exists = function (path, options) {
  try {
    this._resolve(path, options);
    return true;
  }
  catch (e) {
    return false;
  }
};

/**
 * Resolves the given JSON reference and returns the resolved value.
 *
 * @param {string} path - The path being resolved, with a JSON pointer in the hash
 * @param {$RefParserOptions} [options]
 * @returns {*} - Returns the resolved value
 */
$Refs.prototype.get = function (path, options) {
  return this._resolve(path, options).value;
};

/**
 * Sets the value of a nested property within this {@link $Ref#value}.
 * If the property, or any of its parents don't exist, they will be created.
 *
 * @param {string} path - The path of the property to set, optionally with a JSON pointer in the hash
 * @param {*} value - The value to assign
 */
$Refs.prototype.set = function (path, value) {
  var absPath = url.resolve(this._root$Ref.path, path);
  var withoutHash = url.stripHash(absPath);
  var $ref = this._$refs[withoutHash];

  if (!$ref) {
    throw ono('Error resolving $ref pointer "%s". \n"%s" not found.', path, withoutHash);
  }

  $ref.set(absPath, value);
};

/**
 * Creates a new {@link $Ref} object and adds it to this {@link $Refs} object.
 *
 * @param {string} path  - The file path or URL of the referenced file
 */
$Refs.prototype._add = function (path) {
  var withoutHash = url.stripHash(path);

  var $ref = new $Ref();
  $ref.path = withoutHash;
  $ref.$refs = this;

  this._$refs[withoutHash] = $ref;
  this._root$Ref = this._root$Ref || $ref;

  return $ref;
};

/**
 * Resolves the given JSON reference.
 *
 * @param {string} path - The path being resolved, optionally with a JSON pointer in the hash
 * @param {$RefParserOptions} [options]
 * @param {string} [friendlyPath]
 * @returns {Pointer}
 * @protected
 */
$Refs.prototype._resolve = function (path, options, friendlyPath) {
  var absPath = url.resolve(this._root$Ref.path, path);
  var withoutHash = url.stripHash(absPath);
  var $ref = this._$refs[withoutHash];

  if (!$ref) {
    throw ono('Error resolving $ref pointer "%s". \n"%s" not found.', friendlyPath || path, withoutHash);
  }

  return $ref.resolve(absPath, options, friendlyPath || path);
};

/**
 * Returns the specified {@link $Ref} object, or undefined.
 *
 * @param {string} path - The path being resolved, optionally with a JSON pointer in the hash
 * @returns {$Ref|undefined}
 * @protected
 */
$Refs.prototype._get$Ref = function (path) {
  path = url.resolve(this._root$Ref.path, path);
  var withoutHash = url.stripHash(path);
  return this._$refs[withoutHash];
};

/**
 * Returns the encoded and decoded paths keys of the given object.
 *
 * @param {object} $refs - The object whose keys are URL-encoded paths
 * @param {...string|string[]} [types] - Only return paths of the given types ("file", "http", etc.)
 * @returns {object[]}
 */
function getPaths ($refs, types) {
  var paths = Object.keys($refs);

  // Filter the paths by type
  types = Array.isArray(types[0]) ? types[0] : Array.prototype.slice.call(types);
  if (types.length > 0 && types[0]) {
    paths = paths.filter(function (key) {
      return types.indexOf($refs[key].pathType) !== -1;
    });
  }

  // Decode local filesystem paths
  return paths.map(function (path) {
    return {
      encoded: path,
      decoded: $refs[path].pathType === 'file' ? url.toFileSystemPath(path, true) : path
    };
  });
}
