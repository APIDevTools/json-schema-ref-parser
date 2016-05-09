'use strict';

var maybe = require('call-me-maybe');
var ono = require('ono');
var Options = require('./options');
var resolve = require('./resolve');
var parse = require('./parse');
var bundle = require('./bundle');
var dereference = require('./dereference');
var URL = require('./url');

/**
 * Parses a JSON Schema. That's all. It doesn't resolve any of the JSON References in the schema,
 * and it doesn't dereference anything. It just parses a JSON/YAML file and returns the value as
 * a {@link Schema} object.
 *
 * Think of this as a more powerful version of `JSON.parse()` that also supports YAML and will
 * automatically download the file for you.
 *
 * @param {string}            [url]      - The file path or URL of the JSON schema
 * @param {object|string}     [data]     - The JSON schema, as an object, or as a JSON/YAML string.
 *                                         If you omit this, then the data will be downloaded from
 *                                         `url` instead.
 * @param {$RefParserOptions} [options]  - Options that determine how the schema will be parsed
 * @param {function}          [callback] - An error-first callback. The second parameter is the
 *                                         parsed {@link Schema} object.
 *
 * @returns {Promise<Schema>}
 */
exports.parse = function(url, data, options, callback) {
  var args = normalizeArgs(arguments);
  return maybe(args.callback, parse(args.url, args.data, args.options));
};

/**
 * Parses a JSON Schema and resolves any JSON References in it. What does it mean to "resolve"
 * JSON References? I'm glad you asked. It just means we download any external files that are
 * referenced in the JSON Schema, and then parse those files. So, when it's all done, you'll
 * have a {@link Schema} object with the parsed contents of all files in the schema
 * (including the main schema file).
 *
 * This method is just an easy way to read and parse all the files in the schema. That's all.
 * It doesn't make any changes to the schema. All of the $ref entries are still there in each file.
 * If you want to replace the $refs with the actual values they point to, then use the
 * {@link $RefParser#dereference} or {@link $RefParser#bundle} methods instead.
 *
 * @param {string}            [url]      - The file path or URL of the JSON schema
 * @param {object|string}     [data]     - The JSON schema, as an object, or as a JSON/YAML string.
 *                                         If you omit this, then the data will be downloaded from
 *                                         `url` instead.
 * @param {$RefParserOptions} [options]  - Options that determine how the schema will be parsed & resolved
 * @param {function}          [callback] - An error-first callback. The second parameter is the
 *                                         {@link Schema} object.
 *
 * @returns {Promise<Schema>}
 */
exports.resolve = function(url, data, options, callback) {
  var args = normalizeArgs(arguments);
  return maybe(args.callback,
    parse(args.url, args.data, args.options)
      .then(function(schema) {
        return resolve(schema, args.options);
      })
  );
};

/**
 * Parses a JSON Schema and merges all files into a single one. If the schema contains multiple
 * JSON References that point to the same value, then only ONE of those references will be replaced
 * with the value. The other references will just have their `$ref` path modified to point to the
 * new location of the value.
 *
 * The end result is a JSON Schema that only contains INTERNAL $ref pointers, so there are no longer
 * any references to other files. The schema can be serialized as JSON, and the size will be the
 * combined size of all the files in the schema, since each file was only merged into the main schema
 * one time. Any circular references in the schema can also be safely serialized as JSON, since they
 * will just be serialized as `$ref` objects.
 *
 * @param {string}            [url]      - The file path or URL of the JSON schema
 * @param {object|string}     [data]     - The JSON schema, as an object, or as a JSON/YAML string.
 *                                         If you omit this, then the data will be downloaded from
 *                                         `url` instead.
 * @param {$RefParserOptions} [options]  - Options that determine how the schema will be parsed,
 *                                         resolved, and dereferenced
 * @param {function}          [callback] - An error-first callback. The second parameter is the
 *                                         {@link Schema} object.
 *
 * @returns {Promise<Schema>}
 */
exports.bundle = function(url, data, options, callback) {
  var args = normalizeArgs(arguments);
  return maybe(args.callback,
    parse(args.url, args.data, args.options)
      .then(function(schema) {
        return resolve(schema, args.options);
      })
      .then(function(schema) {
        return bundle(schema, args.options);
      })
  );
};

/**
 * Parses a JSON Schema and merges all files into a single one, without any JSON References.
 * Every JSON Reference in the schema will be replaced with the value that it points to.
 * If multiple JSON References point to the same object, then they will all be replaced with the
 * same object instance, so reference equality will be maintained.
 *
 * The end result is a JSON Schema without ANY `$ref` pointers, which means it's just a plain-old
 * JavaScript object, and you don't need any JSON Schema libraries (like this one) to work with it
 * after that.
 *
 * Care must be taken if you serialize this schema as JSON, since it could be much larger than the
 * combined size of all the files in the schema, since each file could be duplicated multiple times
 * in the schema. Also, if there are any circular references in the schema, then it cannot be
 * serialized as JSON.
 *
 * @param {string}            [url]      - The file path or URL of the JSON schema
 * @param {object|string}     [data]     - The JSON schema, as an object, or as a JSON/YAML string.
 *                                         If you omit this, then the data will be downloaded from
 *                                         `url` instead.
 * @param {$RefParserOptions} [options]  - Options that determine how the schema will be parsed,
 *                                         resolved, and dereferenced
 * @param {function}          [callback] - An error-first callback. The second parameter is the
 *                                         {@link Schema} object.
 *
 * @returns {Promise<Schema>}
 */
exports.dereference = function(url, data, options, callback) {
  var args = normalizeArgs(arguments);
  return maybe(args.callback,
    parse(args.url, args.data, args.options)
      .then(function(schema) {
        return resolve(schema, args.options);
      })
      .then(function(schema) {
        return dereference(schema, args.options);
      })
  );
};

/**
 * Normalizes the given arguments, accounting for optional args.
 *
 * @param {Arguments} args
 * @returns {object}
 */
function normalizeArgs(args) {
  var url, data, options, callback;
  args = Array.prototype.slice.call(args);

  if (typeof args[args.length - 1] === 'function') {
    // The last parameter is a callback function
    callback = args.pop();
  }

  // If the first parameter is a string
  if (typeof args[0] === 'string' && args[0].trim()[0] !== '{' && args[0].indexOf('\n') === -1) {
    // The first parameter is the URL
    url = args[0];
    if (typeof args[2] === 'object') {
      // The second parameter is the JSON Schema, and the third parameter is the options
      data = args[1];
      options = args[2];
    }
    else {
      // The second parameter is the options
      data = undefined;
      options = args[1];
    }
  }
  else {
    // The first parameter is the JSON Schema
    url = '';
    data = args[0];
    options = args[1];
  }

  if (!url && !data) {
    var err = ono('Invalid arguments. Expected a URL, file path, JSON/YAML string, or object.');
    return maybe(args.callback, Promise.reject(err));
  }

  if (url) {
    // Make sure the URL is properly encoded
    url = URL.autoEncode(url);

    // Remove any URL fragment (hash)
    var withoutHash = URL.stripHash(url);

    // If `url` is relative, then convert it an absolute URL
    // by resolving it against the current path
    url = URL.resolve(URL.cwd(), withoutHash);
  }

  if (!(options instanceof Options)) {
    options = new Options(options);
  }

  return {
    url: url,
    data: data,
    options: options,
    callback: callback
  };
}
