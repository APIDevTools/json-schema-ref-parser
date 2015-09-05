'use strict';

var Promise        = require('./promise'),
    Options        = require('./options'),
    $Refs          = require('./refs'),
    read           = require('./read'),
    resolve        = require('./resolve'),
    bundle         = require('./bundle'),
    dereference    = require('./dereference'),
    util           = require('./util'),
    url            = require('url'),
    ono            = require('ono'),
    _cloneDeep     = require('lodash/lang/cloneDeep'),
    _isFunction    = require('lodash/lang/isFunction'),
    _isObject      = require('lodash/lang/isObject'),
    _isPlainObject = require('lodash/lang/isPlainObject'),
    _isString      = require('lodash/lang/isString');

module.exports = $RefParser;
module.falsy && require('./_preamble');

/**
 * This class parses a JSON schema, builds a map of its JSON references and their resolved values,
 * and provides methods for traversing, manipulating, and dereferencing those references.
 *
 * @constructor
 */
function $RefParser() {
  /**
   * The parsed (and possibly dereferenced) JSON schema object
   *
   * @type {object}
   * @readonly
   */
  this.schema = null;

  /**
   * The resolved JSON references
   *
   * @type {$Refs}
   */
  this.$refs = new $Refs();

  /**
   * @type {string}
   * @protected
   */
  this._basePath = '';
}

/**
 * Parses the given JSON schema.
 * This method does not resolve any JSON references.
 * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {ParserOptions} [options] - Options that determine how the schema is parsed
 * @param {function} [callback] - An error-first callback. The second parameter is the parsed JSON schema object.
 * @returns {Promise} - The returned promise resolves with the parsed JSON schema object.
 */
$RefParser.parse = function(schema, options, callback) {
  return new $RefParser().parse(schema, options, callback);
};

/**
 * Parses the given JSON schema.
 * This method does not resolve any JSON references.
 * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {ParserOptions} [options] - Options that determine how the schema is parsed
 * @param {function} [callback] - An error-first callback. The second parameter is the parsed JSON schema object.
 * @returns {Promise} - The returned promise resolves with the parsed JSON schema object.
 */
$RefParser.prototype.parse = function(schema, options, callback) {
  if (_isFunction(options)) {
    callback = options;
    options = undefined;
  }

  if (schema && _isObject(schema)) {
    // The schema is an object, not a path/url
    this.schema = _cloneDeep(schema);
    this._basePath = '';

    util.doCallback(callback, null, this.schema);
    return Promise.resolve(this.schema);
  }

  if (!schema || !_isString(schema)) {
    var err = ono('Expected a file path, URL, or object. Got %s', schema);
    util.doCallback(callback, err, schema);
    return Promise.reject(err);
  }

  options = new Options(options);
  var me = this;

  // Resolve the absolute path of the schema
  schema = url.resolve(util.cwd(), schema);
  this._basePath = util.stripHash(schema);

  // Read the schema file/url
  return read(schema, this, options)
    .then(function($ref) {
      // Make sure the file was a POJO (in JSON or YAML format), NOT a Buffer or string
      if ($ref.value && _isPlainObject($ref.value)) {
        me.schema = $ref.value;
        util.doCallback(callback, null, me.schema);
        return me.schema;
      }
      else {
        throw ono.syntax('"%s" is not a valid JSON Schema', me._basePath);
      }
    })
    .catch(function(err) {
      util.doCallback(callback, err);
      return Promise.reject(err);
    });
};

/**
 * Parses the given JSON schema and resolves any JSON references, including references in
 * externally-referenced files.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {ParserOptions} [options] - Options that determine how the schema is parsed and resolved
 * @param {function} [callback]
 * - An error-first callback. The second parameter is a {@link $Refs} object containing the resolved JSON references
 *
 * @returns {Promise}
 * The returned promise resolves with a {@link $Refs} object containing the resolved JSON references
 */
$RefParser.resolve = function(schema, options, callback) {
  return new $RefParser().resolve(schema, options, callback);
};

/**
 * Parses the given JSON schema and resolves any JSON references, including references in
 * externally-referenced files.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {ParserOptions} [options] - Options that determine how the schema is parsed and resolved
 * @param {function} [callback]
 * - An error-first callback. The second parameter is a {@link $Refs} object containing the resolved JSON references
 *
 * @returns {Promise}
 * The returned promise resolves with a {@link $Refs} object containing the resolved JSON references
 */
$RefParser.prototype.resolve = function(schema, options, callback) {
  if (_isFunction(options)) {
    callback = options;
    options = undefined;
  }

  options = new Options(options);
  var me = this;

  return this.parse(schema, options)
    .then(function() {
      return resolve(me, options);
    })
    .then(function() {
      util.doCallback(callback, null, me.$refs);
      return me.$refs;
    })
    .catch(function(err) {
      util.doCallback(callback, err, me.$refs);
      return Promise.reject(err);
    });
};

/**
 * Parses the given JSON schema, resolves any JSON references, and bundles all external references
 * into the main JSON schema. This produces a JSON schema that only has *internal* references,
 * not any *external* references.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {ParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
 * @param {function} [callback] - An error-first callback. The second parameter is the bundled JSON schema object
 * @returns {Promise} - The returned promise resolves with the bundled JSON schema object.
 */
$RefParser.bundle = function(schema, options, callback) {
  return new $RefParser().bundle(schema, options, callback);
};

/**
 * Parses the given JSON schema, resolves any JSON references, and bundles all external references
 * into the main JSON schema. This produces a JSON schema that only has *internal* references,
 * not any *external* references.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {ParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
 * @param {function} [callback] - An error-first callback. The second parameter is the bundled JSON schema object
 * @returns {Promise} - The returned promise resolves with the bundled JSON schema object.
 */
$RefParser.prototype.bundle = function(schema, options, callback) {
  if (_isFunction(options)) {
    callback = options;
    options = undefined;
  }

  options = new Options(options);
  var me = this;

  return this.resolve(schema, options)
    .then(function() {
      bundle(me, options);
      util.doCallback(callback, null, me.schema);
      return me.schema;
    })
    .catch(function(err) {
      util.doCallback(callback, err, me.schema);
      return Promise.reject(err);
    });
};

/**
 * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
 * That is, all JSON references are replaced with their resolved values.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {ParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
 * @param {function} [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
 * @returns {Promise} - The returned promise resolves with the dereferenced JSON schema object.
 */
$RefParser.dereference = function(schema, options, callback) {
  return new $RefParser().dereference(schema, options, callback);
};

/**
 * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
 * That is, all JSON references are replaced with their resolved values.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {ParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
 * @param {function} [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
 * @returns {Promise} - The returned promise resolves with the dereferenced JSON schema object.
 */
$RefParser.prototype.dereference = function(schema, options, callback) {
  if (_isFunction(options)) {
    callback = options;
    options = undefined;
  }

  options = new Options(options);
  var me = this;

  return this.resolve(schema, options)
    .then(function() {
      dereference(me, options);
      util.doCallback(callback, null, me.schema);
      return me.schema;
    })
    .catch(function(err) {
      util.doCallback(callback, err, me.schema);
      return Promise.reject(err);
    });
};
