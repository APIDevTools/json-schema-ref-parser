'use strict';

var $Ref = require('./ref'),
  Pointer = require('./pointer'),
  util = require('./util'),
  ono = require('ono'),
  url = require('url');

module.exports = expand;

/**
 * Crawls the JSON schema, finds all `allOf` fields and expands them into the composed object.
 * This method mutates the JSON schema object, replacing `allOf` fields with their composed values.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 */
function expand(parser, options) {
  util.debug('Expanding AllOf fields in %s', parser._basePath);
  crawl(parser.schema, parser._basePath, [], options);
}

/**
 * Recursively crawls the given value, and expands any `allOf` references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} path - The path to use for resolving relative JSON references
 * @param {object[]} parents - An array of the parent objects that have already been dereferenced
 * @param {$Refs} $refs - The resolved JSON references
 * @param {$RefParserOptions} options
 * @returns {boolean} - Returns true if a circular reference was found
 */
function crawl(obj, options) {

  if (obj && typeof(obj) === 'object') {

    Object.keys(obj).forEach(function(key) {
      var value = obj[key];

      if (value.allOf) {
        var extended = extendSchemas({}, value);
        for (var i = 0; i < value.allOf.length; i++) {
          extended = extendSchemas(extended, value.allOf[i]);
        }
        delete extended.allOf;

        obj[key] = extended;
      }
      else {
        crawl(value, options);
      }


      //   if ($Ref.isAllowed$Ref(value, options)) {
      //     // We found a $ref, so resolve it
      //     util.debug('Dereferencing $ref pointer "%s" at %s', value.$ref, keyPath);
      //     var $refPath = url.resolve(path, value.$ref);
      //     var pointer = $refs._resolve($refPath, options);

      //     // Dereference the JSON reference
      //     var dereferencedValue = getDereferencedValue(value, pointer.value);

      //     // Crawl the dereferenced value (unless it's circular)
      //     if (!circular) {
      //       // If the `crawl` method returns true, then dereferenced value is circular
      //       crawl(dereferencedValue, pointer.path, parents, $refs, options);
      //     }

      //     // Replace the JSON reference with the dereferenced value
      //     if (options.$refs.circular === true) {
      //       obj[key] = dereferencedValue;
      //     }
      //   }
      //   else {
      //     if (parents.indexOf(value) === -1) {
      //       crawl(value, keyPath, parents, $refs, options);
      //     }
      //     else {
      //       foundCircularReference(keyPath, $refs, options);
      //     }
      //   }


    });

  }

  return;
}


function extendSchemas(obj1, obj2) {
  obj1 = $extend({}, obj1);
  obj2 = $extend({}, obj2);

  var extended = {};

  $each(obj1, function(prop, val) {
    // If this key is also defined in obj2, merge them
    if (typeof obj2[prop] !== "undefined") {
      // Required arrays should be unioned together
      if (prop === 'required' && typeof val === "object" && Array.isArray(val)) {
        // Union arrays and unique
        extended.required = val.concat(obj2[prop]).reduce(function(p, c) {
          if (p.indexOf(c) < 0) p.push(c);
          return p;
        }, []);
      }
      // Type should be intersected and is either an array or string
      else if (prop === 'type' && (typeof val === "string" || Array.isArray(val))) {
        // Make sure we're dealing with arrays
        if (typeof val === "string") val = [val];
        if (typeof obj2.type === "string") obj2.type = [obj2.type];


        extended.type = val.filter(function(n) {
          return obj2.type.indexOf(n) !== -1;
        });

        // If there's only 1 type and it's a primitive, use a string instead of array
        if (extended.type.length === 1 && typeof extended.type[0] === "string") {
          extended.type = extended.type[0];
        }
      }
      // All other arrays should be intersected (enum, etc.)
      else if (typeof val === "object" && Array.isArray(val)) {
        extended[prop] = val.filter(function(n) {
          return obj2[prop].indexOf(n) !== -1;
        });
      }
      // Objects should be recursively merged
      else if (typeof val === "object" && val !== null) {
        extended[prop] = extendSchemas(val, obj2[prop]);
      }
      // Otherwise, use the first value
      else {
        extended[prop] = val;
      }
    }
    // Otherwise, just use the one in obj1
    else {
      extended[prop] = val;
    }
  });
  // Properties in obj2 that aren't in obj1
  $each(obj2, function(prop, val) {
    if (typeof obj1[prop] === "undefined") {
      extended[prop] = val;
    }
  });

  return extended;
}

/**
 * Taken from jQuery 2.1.3
 *
 * @param obj
 * @returns {boolean}
 */

function $isplainobject(obj) {
  // Not plain objects:
  // - Any object or value whose internal [[Class]] property is not "[object Object]"
  // - DOM nodes
  // - window
  if (typeof obj !== "object" || obj.nodeType || (obj !== null && obj === obj.window)) {
    return false;
  }

  if (obj.constructor && !Object.prototype.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
    return false;
  }

  // If the function hasn't returned already, we're confident that
  // |obj| is a plain object, created by {} or constructed with new Object
  return true;
}

function $extend(destination) {
  var source, i, property;
  for (i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (property in source) {
      if (!source.hasOwnProperty(property)) continue;
      if (source[property] && $isplainobject(source[property])) {
        if (!destination.hasOwnProperty(property)) destination[property] = {};
        $extend(destination[property], source[property]);
      }
      else {
        destination[property] = source[property];
      }
    }
  }
  return destination;
}

function $each(obj, callback) {
  if (!obj || typeof obj !== "object") return;
  var i;
  if (Array.isArray(obj) || (typeof obj.length === 'number' && obj.length > 0 && (obj.length - 1) in obj)) {
    for (i = 0; i < obj.length; i++) {
      if (callback(i, obj[i]) === false) return;
    }
  }
  else {
    if (Object.keys) {
      var keys = Object.keys(obj);
      for (i = 0; i < keys.length; i++) {
        if (callback(keys[i], obj[keys[i]]) === false) return;
      }
    }
    else {
      for (i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (callback(i, obj[i]) === false) return;
      }
    }
  }
}