'use strict';

var Promise        = require('./promise'),
    Options        = require('./options'),
    PathOrUrl      = require('./path-or-url'),
    $Refs          = require('./refs'),
    read           = require('./read'),
    resolve        = require('./resolve'),
    dereference    = require('./dereference'),
    util           = require('./util'),
    _cloneDeep     = require('lodash/lang/cloneDeep'),
    _isFunction    = require('lodash/lang/isFunction'),
    _isObject      = require('lodash/lang/isObject'),
    _isPlainObject = require('lodash/lang/isPlainObject'),
    _isString      = require('lodash/lang/isString');

module.exports = $RefParser;

function $RefParser() {
  /**
   * The parsed (and possibly dereferenced) JSON schema object
   *
   * @type {object}
   * @readonly
   */
  this.schema = null;

  /**
   * The resolved $ref pointers
   *
   * @type {$Refs}
   */
  this.$refs = new $Refs();

  /**
   * @type {PathOrUrl}
   * @protected
   */
  this._base = null;
}

$RefParser.parse = function(schema, options, callback) {
  return new $RefParser().parse(schema, options, callback);
};

$RefParser.prototype.parse = function(schema, options, callback) {
  if (_isFunction(options)) {
    callback = options;
    options = undefined;
  }

  if (schema && _isObject(schema)) {
    // The schema is an object, not a path/url
    this.schema = _cloneDeep(schema);
    this._base = PathOrUrl.cwd();

    util.doCallback(callback, null, this.schema);
    return Promise.resolve(this.schema);
  }

  if (!schema || !_isString(schema)) {
    var err = util.newError('Expected a file path, URL, or object. Got %s', schema);
    util.doCallback(callback, err, schema);
    return Promise.reject(err);
  }

  options = new Options(options);
  var me = this;

  // Resolve the full URL of the schema
  this._base = new PathOrUrl(schema, {allowFileHash: true});

  // Read the schema file/url
  return read(this._base, this, options)
    .then(function($ref) {
      // Make sure the file was a POJO (in JSON or YAML format), NOT a Buffer or string
      if ($ref.value && _isPlainObject($ref.value)) {
        me.schema = $ref.value;
        util.doCallback(callback, null, me.schema);
        return me.schema;
      }
      else {
        throw util.newError(SyntaxError, '"%s" is not a valid JSON Schema', me._base);
      }
    })
    .catch(function(err) {
      util.doCallback(callback, err);
      return Promise.reject(err);
    });
};

$RefParser.resolve = function(schema, options, callback) {
  return new $RefParser().resolve(schema, options, callback);
};

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

$RefParser.dereference = function(schema, options, callback) {
  return new $RefParser().dereference(schema, options, callback);
};

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
