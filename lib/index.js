'use strict';

var Promise     = require('./util/promise'),
    Options     = require('./options'),
    $Refs       = require('./refs'),
    parse       = require('./parse'),
    resolve     = require('./resolve'),
    bundle      = require('./bundle'),
    dereference = require('./dereference'),
    url         = require('./util/url'),
    maybe       = require('call-me-maybe'),
    ono         = require('ono');

module.exports = $RefParser;
module.exports.YAML = require('./util/yaml');

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
   * @readonly
   */
  this.$refs = new $Refs();
}

/**
 * Parses the given JSON schema.
 * This method does not resolve any JSON references.
 * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed
 * @param {function} [callback] - An error-first callback. The second parameter is the parsed JSON schema object.
 * @returns {Promise} - The returned promise resolves with the parsed JSON schema object.
 */
$RefParser.parse = function(schema, options, callback) {
  var Class = this; // eslint-disable-line consistent-this
  return new Class().parse(schema, options, callback);
};

/**
 * Parses the given JSON schema.
 * This method does not resolve any JSON references.
 * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed
 * @param {function} [callback] - An error-first callback. The second parameter is the parsed JSON schema object.
 * @returns {Promise} - The returned promise resolves with the parsed JSON schema object.
 */
$RefParser.prototype.parse = function(schema, options, callback) {
  var args = normalizeArgs(arguments);

  if (!args.schema || typeof args.schema !== 'string' || typeof args.schema !== 'object') {
    var err = ono('Expected a file path, URL, or object. Got %s', args.schema);
    return maybe(args.callback, Promise.reject(err));
  }

  var promise;
  this.$refs = new $Refs();

  if (typeof args.schema === 'object') {
    // The schema is an object, not a path/url
    this.$refs._basePath = '';
    this.$refs._add('', args.schema);
    promise = Promise.resolve(args.schema);
  }
  else {
    // Resolve the absolute path of the schema
    var path = args.schema;
    path = url.localPathToUrl(path);
    path = url.resolve(url.cwd(), path);
    this.$refs._basePath = url.stripHash(path);

    // Parse the schema file/url
    promise = parse(path, this.$refs, args.options);
  }

  var me = this;
  return promise
    .then(function(result) {
      if (!result || typeof result !== 'object' || Buffer.isBuffer(result)) {
        throw ono.syntax('"%s" is not a valid JSON Schema', me.$refs._basePath || result);
      }
      else {
        me.schema = result;
        return maybe(args.callback, Promise.resolve(me.schema));
      }
    })
    .catch(function(e) {
      return maybe(args.callback, Promise.reject(e));
    });
};

/**
 * Parses the given JSON schema and resolves any JSON references, including references in
 * externally-referenced files.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed and resolved
 * @param {function} [callback]
 * - An error-first callback. The second parameter is a {@link $Refs} object containing the resolved JSON references
 *
 * @returns {Promise}
 * The returned promise resolves with a {@link $Refs} object containing the resolved JSON references
 */
$RefParser.resolve = function(schema, options, callback) {
  var Class = this; // eslint-disable-line consistent-this
  return new Class().resolve(schema, options, callback);
};

/**
 * Parses the given JSON schema and resolves any JSON references, including references in
 * externally-referenced files.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed and resolved
 * @param {function} [callback]
 * - An error-first callback. The second parameter is a {@link $Refs} object containing the resolved JSON references
 *
 * @returns {Promise}
 * The returned promise resolves with a {@link $Refs} object containing the resolved JSON references
 */
$RefParser.prototype.resolve = function(schema, options, callback) {
  var me = this;
  var args = normalizeArgs(arguments);

  return this.parse(args.schema, args.options)
    .then(function() {
      return resolve(me, args.options);
    })
    .then(function() {
      return maybe(args.callback, Promise.resolve(me.$refs));
    })
    .catch(function(err) {
      return maybe(args.callback, Promise.reject(err));
    });
};

/**
 * Parses the given JSON schema, resolves any JSON references, and bundles all external references
 * into the main JSON schema. This produces a JSON schema that only has *internal* references,
 * not any *external* references.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
 * @param {function} [callback] - An error-first callback. The second parameter is the bundled JSON schema object
 * @returns {Promise} - The returned promise resolves with the bundled JSON schema object.
 */
$RefParser.bundle = function(schema, options, callback) {
  var Class = this; // eslint-disable-line consistent-this
  return new Class().bundle(schema, options, callback);
};

/**
 * Parses the given JSON schema, resolves any JSON references, and bundles all external references
 * into the main JSON schema. This produces a JSON schema that only has *internal* references,
 * not any *external* references.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
 * @param {function} [callback] - An error-first callback. The second parameter is the bundled JSON schema object
 * @returns {Promise} - The returned promise resolves with the bundled JSON schema object.
 */
$RefParser.prototype.bundle = function(schema, options, callback) {
  var me = this;
  var args = normalizeArgs(arguments);

  return this.resolve(args.schema, args.options)
    .then(function() {
      bundle(me, args.options);
      return maybe(args.callback, Promise.resolve(me.schema));
    })
    .catch(function(err) {
      return maybe(args.callback, Promise.reject(err));
    });
};

/**
 * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
 * That is, all JSON references are replaced with their resolved values.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
 * @param {function} [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
 * @returns {Promise} - The returned promise resolves with the dereferenced JSON schema object.
 */
$RefParser.dereference = function(schema, options, callback) {
  var Class = this; // eslint-disable-line consistent-this
  return new Class().dereference(schema, options, callback);
};

/**
 * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
 * That is, all JSON references are replaced with their resolved values.
 *
 * @param {string|object} schema - The file path or URL of the JSON schema. Or a JSON schema object.
 * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
 * @param {function} [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
 * @returns {Promise} - The returned promise resolves with the dereferenced JSON schema object.
 */
$RefParser.prototype.dereference = function(schema, options, callback) {
  var me = this;
  var args = normalizeArgs(arguments);

  return this.resolve(args.schema, args.options)
    .then(function() {
      dereference(me, args.options);
      return maybe(args.callback, Promise.resolve(me.schema));
    })
    .catch(function(err) {
      return maybe(args.callback, Promise.reject(err));
    });
};

/**
 * Normalizes the given arguments, accounting for optional args.
 *
 * @param {Arguments} args
 * @returns {object}
 */
function normalizeArgs(args) {
  var options = args[1], callback = args[2];
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  if (!(options instanceof Options)) {
    options = new Options(options);
  }
  return {
    schema: args[0],
    options: options,
    callback: callback
  };
}
