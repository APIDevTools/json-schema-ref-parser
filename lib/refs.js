'use strict';

var Url     = require('./url'),
    Options = require('./options'),
    util    = require('./util'),
    _reduce = require('lodash/collection/reduce');

module.exports = $Refs;

function $Refs() {
  /**
   * A map of URLs to {@link $Ref} objects
   *
   * @type {object}
   * @private
   */
  this._$refs = {};
}

$Refs.prototype.toJSON = function() {
  return _reduce(this._$refs, function($refs, $ref, url) {
    $refs[url] = $ref.value;
    return $refs;
  }, {});
};

/**
 * @param {string} $ref
 * @param {Options} [options]
 * @returns {boolean}
 */
$Refs.prototype.exists = function($ref, options) {
  try {
    this.get($ref, options);
    return true;
  }
  catch (e) {
    return false;
  }
};

/**
 * @param {string} $ref
 * @param {Options} [options]
 * @returns {*}
 */
$Refs.prototype.get = function($ref, options) {
  var url = new Url($ref);
  var hasHash = url.hash;
  url.hash = null;
  var $refObj = this._$refs[url.format()];

  if (!$refObj) {
    throw util.newError('Error resolving $ref pointer "%s". \n"%s" not found.', $ref, url);
  }

  if (!hasHash) {
    return $refObj.value;
  }

  options = new Options(options);
  return $refObj.get(new Url($ref), options);
};

/**
 * @param {string} $ref
 * @param {*} value
 * @param {Options} [options]
 */
$Refs.prototype.set = function($ref, value, options) {
  var url = new Url($ref);
  var hasHash = url.hash;
  url.hash = null;
  var $refObj = this._$refs[url.format()];

  if (!$refObj) {
    throw util.newError('Error resolving $ref pointer "%s". \n"%s" not found.', $ref, url);
  }

  if (!hasHash) {
    $refObj.value = value;
  }

  options = new Options(options);
  $refObj.set(new Url($ref), value, options);
};

/**
 * @param {Url} url
 * @returns {$Ref|undefined}
 * @protected
 */
$Refs.prototype._get$Ref = function(url) {
  if (url.hash) {
    url = new Url(url);
    url.hash = null;
  }

  return this._$refs[url.format()];
};

/**
 * @param {$Ref} $ref
 * @protected
 */
$Refs.prototype._set$Ref = function($ref) {
  $ref.url.hash = null;
  $ref.$refs = this;
  this._$refs[$ref.url.format()] = $ref;
};
