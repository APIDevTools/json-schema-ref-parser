'use strict';

var $Ref = exports;

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
  var key, keys = Object.keys($ref);

  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    if (key !== '$ref') {
      merged[key] = $ref[key];
    }
  }

  keys = Object.keys(resolvedValue);
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    if (!(key in merged)) {
      merged[key] = resolvedValue[key];
    }
  }

  return merged;
};
