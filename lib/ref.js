'use strict';

var util      = require('./util'),
    PathOrUrl = require('./path-or-url'),
    _isObject = require('lodash/lang/isObject'),
    _isNumber = require('lodash/lang/isNumber'),
    _isString = require('lodash/lang/isString');

module.exports = $Ref;

/**
 * @param {PathOrUrl} pathOrUrl
 * @constructor
 */
function $Ref(pathOrUrl) {
  /**
   * @type {$Refs}
   */
  this.$refs = null;

  /**
   * @type {PathOrUrl}
   */
  this.pathOrUrl = pathOrUrl;

  /**
   * @type {*}
   */
  this.value = undefined;

  /**
   * @type {string}
   */
  this.type = 'pending';

  /**
   * @type {Date}
   */
  this.expires = undefined;
}

/**
 * @param {*} value
 * @param {Options} options
 */
$Ref.prototype.setValue = function(value, options) {
  this.value = value;

  // Extend the cache expiration
  var cacheDuration = options.cache[this.type];
  if (_isNumber(cacheDuration)) {
    var expires = Date.now() + (cacheDuration * 1000);
    this.expires = new Date(expires);
  }
};

$Ref.prototype.isExpired = function() {
  return this.expires && this.expires <= new Date();
};

$Ref.prototype.expire = function() {
  this.expires = new Date();
};

$Ref.prototype.exists = function(hash) {
  try {
    this.get(hash);
    return true;
  }
  catch (e) {
    return false;
  }
};

/**
 * @param {PathOrUrl} pathOrUrl
 * @param {Options} options
 * @returns {*}
 */
$Ref.prototype.get = function(pathOrUrl, options) {
  try {
    var props = parse(pathOrUrl.hash);
    var prop = {
      pathOrUrl: pathOrUrl,
      value: this.value
    };

    for (var i = 0; i < props.length; i++) {
      resolve(prop, this, options);

      if (props[i] in prop.value) {
        prop.value = prop.value[props[i]];
      }
    }

    return resolve(prop, this, options).value;
  }
  catch (e) {
    throw util.newError(SyntaxError, e,
      'Error resolving $ref pointer "%s". \n"%s" not found.', pathOrUrl, pathOrUrl.hash);
  }
};

/**
 * @param {PathOrUrl} pathOrUrl
 * @param {*} value
 * @param {Options} options
 */
$Ref.prototype.set = function(pathOrUrl, value, options) {
  try {
    var props = parse(pathOrUrl.hash);
    var prop = {
      pathOrUrl: pathOrUrl,
      value: this.value
    };

    for (var i = 0; i < props.length - 1; i++) {
      resolve(prop, this, options);

      if (props[i] in prop.value) {
        prop.value = prop.value[props[i]];
      }
      else {
        prop.value = prop.value[props[i]] = {};
      }
    }

    resolve(prop, this, options);
    prop.value[props[props.length - 1]] = value;
  }
  catch (e) {
    throw util.newError(SyntaxError, e,
      'Error resolving $ref pointer "%s". \n"%s" not found.', pathOrUrl, pathOrUrl.hash);
  }
};

/**
 * @param {*} value
 * @param {Options} options
 * @returns {boolean}
 */
$Ref.isAllowed = function(value, options) {
  if (value && _isObject(value) && _isString(value.$ref)) {
    if (value.$ref[0] === '#') {
      if (options.$refs.internal) {
        return true;
      }
    }
    else if (options.$refs.external) {
      return true;
    }
  }
};

/**
 * @param {string} hash
 * @returns {string[]}
 */
function parse(hash) {
  // Remove the leading hash if it exists
  hash = hash[0] === '#' ? hash.substr(1) : hash;

  // Split into an array
  hash = hash.split('/');

  // Decode each part, according to RFC 6901
  // https://tools.ietf.org/html/rfc6901#section-3
  for (var i = 0; i < hash.length; i++) {
    hash[i] = hash[i].replace(/~1/g, '/').replace(/~0/g, '~');
  }

  if (hash[0] !== '') {
    throw util.newError(SyntaxError, 'Invalid $ref pointer "%s". Pointers must begin with "#/"', hash);
  }

  return hash.slice(1);
}

/**
 * @param {{pathOrUrl: PathOrUrl, value: *}} prop
 * @param {$Ref} $ref
 * @param {Options} [options]
 * @returns {{pathOrUrl: PathOrUrl, value: *}}
 */
function resolve(prop, $ref, options) {
  if ($Ref.isAllowed(prop.value, options)) {
    var newPathOrUrl = new PathOrUrl(prop.pathOrUrl.resolve(prop.value.$ref), {allowFileHash: true});

    // Don't resolve circular references
    if (newPathOrUrl.href !== prop.pathOrUrl.href) {
      prop.pathOrUrl = newPathOrUrl;
      prop.value = $ref.$refs.get(prop.pathOrUrl);
    }
  }

  return prop;
}
