'use strict';

var $Ref  = require('./ref');
var URL  = require('./util/url');
var ono  = require('ono');
var slashes  = /\//g;
var tildes  = /~/g;
var escapedSlash = /~1/g;
var escapedTilde = /~0/g;

module.exports = Pointer;

/**
 * This class represents a JSON Pointer path in a {@link File},
 * and the resolved value of the pointer.
 *
 * @constructor
 */
function Pointer() {
  /**
   * The {@link File} that that contains the resolved JSON Pointer value.
   *
   * @type {File}
   */
  this.file = null;

  /**
   * The JSOIN Pointer path within the file.
   *
   * NOTE: For the FULL URL, including the file path and the pointer path,
   * use the {@link Pointer#url} property instead
   *
   * @type {string}
   */
  this.path = '';

  /**
   * The resolved value.
   * This can be ANY JavaScript type, including an object, array, string, number, null, undefined, NaN, etc.
   *
   * @type {*}
   */
  this.value = undefined;

  /**
   * Indicates whether the pointer is a DIRECT circular reference.
   * That is, it points directly to itself.
   *
   * @type {boolean}
   */
  this.circular = false;
}

Object.defineProperties(Pointer.prototype, {
  /**
   * The full URL, including the absolute file path and the JSON Pointer in the hash.
   *
   * @type {string}
   */
  url {
    configurable: true,
    enumerable: true,
    get: function() {
      return this.file.url + this.path;
    }
  },
});

/**
 * Resolve the given JSON Pointer path within the given schema.
 *
 * @param {string} url - A URL with the JSON Pointer path in the hash.
 * @param {Schema} schema - the Schema whose files are used to resolve the pointer path
 */
Pointer.resolve = function resolve(url, schema, options) {
  var pointer = new Pointer();
  pointer.file = schema.files.get(url);
  pointer.path = URL.getHash(url);

  // Crawl the file's value, one token at a time
  var value = pointer.file.data;
  var tokens = Pointer.parse(pointer.path);

  for (var i = 0; i < tokens.length; i++) {
    if (resolveIf$Ref(pointer, schema, options)) {
      // The file & path have changed, so append the remaining tokens to the new path
      pointer.path = Pointer.join(pointer.path, tokens.slice(i));
    }

    var token = tokens[i];
    if (pointer.value[token] === undefined) {
      throw ono.syntax('Error resolving $ref pointer "%s". \nToken "%s" does not exist.', pointer.url, token);
    }
    else {
      pointer.value = pointer.value[token];
    }
  }

  // Resolve the final value
  resolveIf$Ref(pointer, schema, options);
  return pointer;
};

/**
 * Sets the value of a nested property within the given object.
 *
 * @param {*} obj - The object that will be crawled
 * @param {*} value - the value to assign
 * @param {$RefParserOptions} options
 *
 * @returns {*}
 * Returns the modified object, or an entirely new object if the entire object is overwritten.
 */
Pointer.prototype.set = function(obj, value, options) {
  var tokens = Pointer.parse(this.url);
  var token;

  if (tokens.length === 0) {
    // There are no tokens, replace the entire object with the new value
    this.value = value;
    return value;
  }

  // Crawl the object, one token at a time
  this.value = obj;
  for (var i = 0; i < tokens.length - 1; i++) {
    resolveIf$Ref(this, options);

    token = tokens[i];
    if (this.value && this.value[token] !== undefined) {
      // The token exists
      this.value = this.value[token];
    }
    else {
      // The token doesn't exist, so create it
      this.value = setValue(this, token, {});
    }
  }

  // Set the value of the final token
  resolveIf$Ref(this, options);
  token = tokens[tokens.length - 1];
  setValue(this, token, value);

  // Return the updated object
  return obj;
};

/**
 * Parses a JSON pointer (or a URL containing a JSON pointer in the hash)
 * and returns an array of the pointer's tokens.
 * (e.g. "schema.json#/definitions/person/name" => ["definitions", "person", "name"])
 *
 * The pointer is parsed according to RFC 6901
 * {@link https://tools.ietf.org/html/rfc6901#section-3}
 *
 * @param {string} url
 * @returns {string[]}
 */
Pointer.parse = function(url) {
  // Get the JSON pointer from the url's hash
  var pointer = URL.getHash(url).substr(1);

  // If there's no pointer, then there are no tokens,
  // so return an empty array
  if (!pointer) {
    return [];
  }

  // Split into an array
  pointer = pointer.split('/');

  // Decode each part, according to RFC 6901
  for (var i = 0; i < pointer.length; i++) {
    pointer[i] = decodeURI(pointer[i].replace(escapedSlash, '/').replace(escapedTilde, '~'));
  }

  if (pointer[0] !== '') {
    throw ono.syntax('Invalid $ref pointer "%s". Pointers must begin with "#/"', pointer);
  }

  return pointer.slice(1);
};

/**
 * Creates a JSON pointer path, by joining one or more tokens to a base URL.
 *
 * @param {string} url - The base URL (e.g. "schema.json#/definitions/person")
 * @param {string|string[]} tokens - The token(s) to append (e.g. ["name", "first"])
 * @returns {string}
 */
Pointer.join = function join(url, tokens) {
  // Ensure that the URL contains a hash
  if (url.indexOf('#') === -1) {
    url += '#';
  }

  // Append each token to the URL
  tokens = Array.isArray(tokens) ? tokens : [tokens];
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    // Encode the token, according to RFC 6901
    url += '/' + encodeURI(token.replace(tildes, '~0').replace(slashes, '~1'));
  }

  return url;
};

/**
 * If the given pointer's {@link Pointer#value} is a JSON Reference,
 * then the reference is resolved and {@link Pointer#value} is replaced with the resolved value.
 * In addition, {@link Pointer#file} and {@link Pointer#path} are updated to reflect the
 * resolution path of the new value.
 *
 * @param {Pointer} pointer
 * @param {Schema} schema
 * @param {$RefParserOptions} options
 * @returns {boolean} - Returns `true` if the resolution path changed
 */
function resolveIf$Ref(pointer, schema, options) {
  // Determine if the pointer's current value is a JSON Reference (i.e. { $ref: "..." }).
  // We only care about $refs that are allowed by the current options
  if ($Ref.isAllowed(pointer.value, options)) {
    // Resolve the reference, relative to the current file's URL
    var resolvedUrl = URL.resolve(pointer.file.url, pointer.value.$ref);

    if (resolvedUrl === pointer.url) {
      // The value is a reference to itself, so just set the `circular` flag
      pointer.circular = true;
      return;
    }

    var resolved = Pointer.resolve(resolvedUrl, schema, options);

    // Set the pointer's value to the resolved value, possibly merging the two
    // (in the case of an extended $ref)
    pointer.value = $Ref.dereference(pointer.value, resolved.value);

    if (pointer.value === resolved.value) {
      // The pointer resolved to a new value, possibly in a new file.
      // So replace the pointer's file & path with the resolved file & path
      pointer.file = resolved.file;
      pointer.path = resolved.path;
      return true;
    }
  }
}

/**
 * Sets the specified token value of the {@link Pointer#value}.
 *
 * The token is evaluated according to RFC 6901.
 * {@link https://tools.ietf.org/html/rfc6901#section-4}
 *
 * @param {Pointer} pointer - The JSON Pointer whose value will be modified
 * @param {string} token - A JSON Pointer token that indicates how to modify `obj`
 * @param {*} value - The value to assign
 * @returns {*} - Returns the assigned value
 */
function setValue(pointer, token, value) {
  if (pointer.value && typeof pointer.value === 'object') {
    if (token === '-' && Array.isArray(pointer.value)) {
      pointer.value.push(value);
    }
    else {
      pointer.value[token] = value;
    }
  }
  else {
    throw ono.syntax('Error assigning $ref pointer "%s". \nCannot set "%s" of a non-object.', pointer.url, token);
  }
  return value;
}
