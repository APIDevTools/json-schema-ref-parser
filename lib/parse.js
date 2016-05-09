'use strict';

var Schema = require('./schema');
var File = require('./file');
var Promise = require('./util/promise');
var readFile = require('./read-file');
var parseFile = require('./parse-file');
var ono = require('ono');

module.exports = parse;

/**
 * Parses a JSON Schema. That's all. It doesn't resolve any of the JSON References in the schema,
 * and it doesn't dereference anything. It just parses a JSON/YAML file and returns the value as
 * a {@link Schema} object.
 *
 * Think of this as a more powerful version of `JSON.parse()` that also supports YAML and will
 * automatically download the file for you.
 *
 * @param {string}            url      - The absolute URL of the JSON schema, without any fragment (hash)
 * @param {object|string}     data     - The JSON schema, as an object, or as a JSON/YAML string.
 *                                       If null, then the data will be downloaded from `url` instead.
 * @param {$RefParserOptions} options  - Options that determine how the schema will be parsed
 *
 * @returns {Promise<Schema>}
 */
function parse(url, data, options) {
  return new Promise(function(resolve, reject) {
    var schema = new Schema();
    var file = new File(url);
    schema.files.push(file);

    if (typeof data === 'string') {
      // `data` is a JSON/YAML string, so parse it
      file.data = data;
      parseFile(file, options).then(returnTheSchema, reject);
    }
    else if (data) {
      // `data` is already parsed, so just use it as-is
      file.data = data;
      file.parsed = true;
      returnTheSchema();
    }
    else {
      // No `data` was provided, so resolve the `url` and then parse its data
      readFile(file, options)
        .then(function() {
          return parseFile(file, options);
        }, reject)
        .then(returnTheSchema);
    }

    /**
     * Resolve or rejects the promise, depending on whether the parsed file data
     * is a valid JSON Schema object.
     */
    function returnTheSchema() {
      if (!file.data || typeof file.data !== 'object' || Array.isArray(file.data)) {
        reject(ono.syntax('"%s" is not a valid JSON Schema', url || file.data));
      }
      else {
        resolve(schema);
      }
    }
  });
}
