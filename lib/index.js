'use strict';
var normalize_args_1 = require('./normalize-args');
var refs_1 = require('./refs');
var parse_1 = require('./parse');
var resolve_external_1 = require('./resolve-external');
var bundle_1 = require('./bundle');
var dereference_1 = require('./dereference');
var url_1 = require('./util/url');
var maybe = require('call-me-maybe');
var ono = require('ono');
var yaml_1 = require('./util/yaml');
/**
 * This class parses a JSON schema, builds a map of its JSON references and their resolved values,
 * and provides methods for traversing, manipulating, and dereferencing those references.
 */
var $RefParser = /** @class */ (function () {
  function $RefParser () {
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
    this.$refs = new refs_1.default();
  }
  /**
     * Parses the given JSON schema.
     * This method does not resolve any JSON references.
     * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
     *
     * @param {string} [path] - The file path or URL of the JSON schema
     * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
     * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed
     * @param {function} [callback] - An error-first callback. The second parameter is the parsed JSON schema object.
     * @returns {Promise} - The returned promise resolves with the parsed JSON schema object.
     */
  $RefParser.parse = function (path, schema, options, callback) {
    var Class = this; // eslint-disable-line consistent-this
    var instance = new Class();
    return instance.parse.apply(instance, arguments);
  };
  $RefParser.prototype.parse = function (pos, soooc, ooc, cb) {
    var args = normalize_args_1.normalizeArgs(arguments);
    var promise;
    if (!args.path && !args.schema) {
      var err = ono('Expected a file path, URL, or object. Got %s', args.path || args.schema);
      return maybe(args.callback, Promise.reject(err));
    }
    // Reset everything
    this.schema = null;
    this.$refs = new refs_1.default();
    // If the path is a filesystem path, then convert it to a URL.
    // NOTE: According to the JSON Reference spec, these should already be URLs,
    // but, in practice, many people use local filesystem paths instead.
    // So we're being generous here and doing the conversion automatically.
    // This is not intended to be a 100% bulletproof solution.
    // If it doesn't work for your use-case, then use a URL instead.
    var pathType = 'http';
    if (url_1.isFileSystemPath(args.path)) {
      args.path = url_1.fromFileSystemPath(args.path);
      pathType = 'file';
    }
    // Resolve the absolute path of the schema
    args.path = url_1.resolve(url_1.cwd(), args.path);
    if (args.schema && typeof args.schema === 'object') {
      // A schema object was passed-in.
      // So immediately add a new $Ref with the schema object as its value
      var $ref = this.$refs._add(args.path);
      $ref.value = args.schema;
      $ref.pathType = pathType;
      promise = Promise.resolve(args.schema);
    }
    else {
      // Parse the schema file/url
      promise = parse_1.default(args.path, this.$refs, args.options);
    }
    var me = this;
    return maybe(args.callback, promise.then(function (result) {
      if (!result || typeof result !== 'object' || Buffer.isBuffer(result)) {
        throw ono.syntax('"%s" is not a valid JSON Schema', me.$refs._root$Ref ? me.$refs._root$Ref.path : result);
      }
      else {
        me.schema = result;
        return me.schema;
      }
    }));
  };
  /**
     * Parses the given JSON schema and resolves any JSON references, including references in
     * externally-referenced files.
     *
     * @param {string} [path] - The file path or URL of the JSON schema
     * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
     * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed and resolved
     * @param {function} [callback]
     * - An error-first callback. The second parameter is a {@link $Refs} object containing the resolved JSON references
     *
     * @returns {Promise}
     * The returned promise resolves with a {@link $Refs} object containing the resolved JSON references
     */
  $RefParser.resolve = function (path, schema, options, callback) {
    var Class = this; // eslint-disable-line consistent-this
    var instance = new Class();
    return instance.resolve.apply(instance, arguments);
  };
  $RefParser.prototype.resolve = function (path, schema, options, callback) {
    var me = this;
    var args = normalize_args_1.normalizeArgs(arguments);
    return maybe(args.callback, this.parse(args.path, args.schema, args.options)
      .then(function () {
        return resolve_external_1.default(me, args.options);
      })
      .then(function () {
        return me.$refs;
      }));
  };
  /**
     * Parses the given JSON schema, resolves any JSON references, and bundles all external references
     * into the main JSON schema. This produces a JSON schema that only has *internal* references,
     * not any *external* references.
     *
     * @param {string} [path] - The file path or URL of the JSON schema
     * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
     * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
     * @param {function} [callback] - An error-first callback. The second parameter is the bundled JSON schema object
     * @returns {Promise} - The returned promise resolves with the bundled JSON schema object.
     */
  $RefParser.bundle = function (path, schema, options, callback) {
    var Class = this; // eslint-disable-line consistent-this
    var instance = new Class();
    return instance.bundle.apply(instance, arguments);
  };
  /**
     * Parses the given JSON schema, resolves any JSON references, and bundles all external references
     * into the main JSON schema. This produces a JSON schema that only has *internal* references,
     * not any *external* references.
     *
     * @param {string} [path] - The file path or URL of the JSON schema
     * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
     * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
     * @param {function} [callback] - An error-first callback. The second parameter is the bundled JSON schema object
     * @returns {Promise} - The returned promise resolves with the bundled JSON schema object.
     */
  $RefParser.prototype.bundle = function (path, schema, options, callback) {
    var me = this;
    var args = normalize_args_1.normalizeArgs(arguments);
    return maybe(args.callback, this.resolve(args.path, args.schema, args.options).then(function () {
      bundle_1.default(me, args.options);
      return me.schema;
    }));
  };
  /**
     * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
     * That is, all JSON references are replaced with their resolved values.
     *
     * @param {string} [path] - The file path or URL of the JSON schema
     * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
     * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
     * @param {function} [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
     * @returns {Promise} - The returned promise resolves with the dereferenced JSON schema object.
     */
  $RefParser.dereference = function (path, schema, options, callback) {
    var Class = this; // eslint-disable-line consistent-this
    var instance = new Class();
    return instance.dereference.apply(instance, arguments);
  };
  /**
     * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
     * That is, all JSON references are replaced with their resolved values.
     *
     * @param {string} [path] - The file path or URL of the JSON schema
     * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
     * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
     * @param {function} [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
     * @returns {Promise} - The returned promise resolves with the dereferenced JSON schema object.
     */
  $RefParser.prototype.dereference = function (path, schema, options, callback) {
    var me = this;
    var args = normalize_args_1.normalizeArgs(arguments);
    return maybe(args.callback, this.resolve(args.path, args.schema, args.options).then(function () {
      dereference_1.default(me, args.options);
      return me.schema;
    }));
  };
  return $RefParser;
}());

$RefParser.YAML = yaml_1.default;
module.exports = $RefParser;
