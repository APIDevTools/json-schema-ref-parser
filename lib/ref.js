'use strict';

var ono = require('ono');
var Pointer = require('./pointer');
var URL = require('./util/url');
var $Ref = exports;

/**
 * Determines whether the given JSON reference exists within this {@link $Ref#value}.
 *
 * @param {string} url - The full URL being resolved, optionally with a JSON pointer in the hash
 * @param {$RefParserOptions} options
 * @returns {boolean}
 */
// $Ref.exists = function(url, options) {
//   try {
//     this.resolve(url, options);
//     return true;
//   }
//   catch (e) {
//     return false;
//   }
// };

/**
 * Resolves the given JSON reference within this {@link $Ref#value} and returns the resolved value.
 *
 * @param {string} url - The full URL being resolved, optionally with a JSON pointer in the hash
 * @param {$RefParserOptions} options
 * @returns {*} - Returns the resolved value
 */
// $Ref.get = function(url, options) {
//   return this.resolve(url, options).value;
// };

/**
 * Sets the value of a nested property within this {@link $Ref#value}.
 * If the property, or any of its parents don't exist, they will be created.
 *
 * @param {string} url - The full URL of the property to set, optionally with a JSON pointer in the hash
 * @param {*} value - The value to assign
 */
// $Ref.set = function(url, value) {
//   var pointer = new Pointer(this, url);
//   this.value = pointer.set(this.value, value);
// };

/**
 * Returns the {@link File} object from the given {@link Schema} that corresponds to the given URL.
 * Unlike {@link FileArray#get}, this method does not accept relative URLs, only absolute.
 *
 * @param {Schema} schema - The Schema object in which the URL is resolved
 * @param {string} url - An absolute URL, any hash portion will be ignored
 * @returns {File}
 */
// $Ref.resolveFile = function resolveFile(schema, url) {
//   var fileUrl = URL.stripHash(url);
//   for (var i = 0; i < schema.files.length; i++) {
//     if (schema.files[i].url === fileUrl) {
//       return schema.files[i];
//     }
//   }
//   throw ono('Error resolving "%s". \nThe file (%s) was not found in the schema.', url, fileUrl);
// };

/**
 * Determines whether the given value is a JSON reference.
 *
 * @param {*} value - The value to inspect
 * @returns {boolean}
 */
$Ref.is$Ref = function is$Ref(value) {
  return value && typeof value === 'object' && typeof value.$ref === 'string' && value.$ref.length > 0;
};

/**
 * Determines whether the given value is an external JSON reference.
 *
 * @param {*} value - The value to inspect
 * @returns {boolean}
 */
$Ref.isExternal = function isExternal(value) {
  return $Ref.is$Ref(value) && value.$ref[0] !== '#';
};

/**
 * Determines whether the given value is a JSON reference that is allowed by the given options.
 * For example, if it references an external file, then options.resolve.external must be true.
 *
 * @param {*} value - The value to inspect
 * @param {$RefParserOptions} options
 * @returns {boolean}
 */
$Ref.isAllowed = function isAllowed(value, options) {
  if ($Ref.is$Ref(value)) {
    if (value.$ref[0] === '#' || !options || options.resolve.external) {
      return true;
    }
  }
};

/**
 * Determines whether the given value is a JSON reference that "extends" its resolved value.
 * That is, it has extra properties (in addition to "$ref"), so rather than simply pointing to
 * an existing value, this $ref actually creates a NEW value that is a shallow copy of the resolved
 * value, plus the extra properties.
 *
 * @example:
 *  {
 *    person: {
 *      properties: {
 *        firstName: { type: string }
 *        lastName: { type: string }
 *      }
 *    }
 *    employee: {
 *      properties: {
 *        $ref: #/person/properties
 *        salary: { type: number }
 *      }
 *    }
 *  }
 *
 *  In this example, "employee" is an extended $ref, since it extends "person" with an additional
 *  property (salary).  The result is a NEW value that looks like this:
 *
 *  {
 *    properties: {
 *      firstName: { type: string }
 *      lastName: { type: string }
 *      salary: { type: number }
 *    }
 *  }
 *
 * @param {*} value - The value to inspect
 * @returns {boolean}
 */
$Ref.isExtended = function isExtended(value) {
  return $Ref.is$Ref(value) && Object.keys(value).length > 1;
};

/**
 * Returns the dereferenced value of a JSON Reference.
 * If necessary, the resolved value is merged with the JSON Reference to create a new object
 *
 * @example:
 *  {
 *    person: {
 *      properties: {
 *        firstName: { type: string }
 *        lastName: { type: string }
 *      }
 *    }
 *    employee: {
 *      properties: {
 *        $ref: #/person/properties
 *        salary: { type: number }
 *      }
 *    }
 *  }
 *
 *  When "person" and "employee" are merged, you end up with the following object:
 *
 *  {
 *    properties: {
 *      firstName: { type: string }
 *      lastName: { type: string }
 *      salary: { type: number }
 *    }
 *  }
 *
 * @param {object} $ref - The JSON Reference object (with a `$ref` property)
 * @param {*} resolvedValue - The resolved value, which can be any type
 * @returns {*} - Returns the dereferenced value
 */
$Ref.dereference = function dereference($ref, resolvedValue) {
  if (!resolvedValue || typeof resolvedValue !== 'object') {
    // The resolved value is not an object, so it can't be merged.
    // So just return it as-is
    return resolvedValue;
  }

  if (!$Ref.isExtended($ref)) {
    // The $ref does not extend the resolved value. So just return it as-is.
    return resolvedValue;
  }

  // The $Ref extends the resolved value, creating a new object
  var merged = {};
  Object.keys($ref).forEach(function(key) {
    if (key !== '$ref') {
      merged[key] = $ref[key];
    }
  });
  Object.keys(resolvedValue).forEach(function(key) {
    if (!(key in merged)) {
      merged[key] = resolvedValue[key];
    }
  });
  return merged;
};
