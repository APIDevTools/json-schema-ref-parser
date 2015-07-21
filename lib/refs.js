'use strict';

var PathOrUrl = require('./path-or-url'),
    Options   = require('./options'),
    util      = require('./util'),
    _reduce   = require('lodash/collection/reduce');

module.exports = $Refs;

function $Refs() {
  /**
   * A map of paths/urls to {@link $Ref} objects
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
  return this._resolve($ref, options).value;
};

/**
 * @param {string} $ref
 * @param {*} value
 * @param {Options} [options]
 */
$Refs.prototype.set = function($ref, value, options) {
  var pathOrUrl = new PathOrUrl($ref, {allowFileHash: true});
  var withoutHash = new PathOrUrl(pathOrUrl);
  withoutHash.hash = '';
  var $refObj = this._$refs[withoutHash.format()];

  if (!$refObj) {
    throw util.newError('Error resolving $ref pointer "%s". \n"%s" not found.', $ref, pathOrUrl);
  }

  if (!pathOrUrl.hash) {
    $refObj.value = value;
  }

  options = new Options(options);
  $refObj.set(pathOrUrl, value, options);
};

/**
 * @param {string} $ref
 * @param {Options} [options]
 * @returns {Resolved$Ref}
 * @protected
 */
$Refs.prototype._resolve = function($ref, options) {
  var pathOrUrl = new PathOrUrl($ref, {allowFileHash: true});
  var withoutHash = new PathOrUrl(pathOrUrl);
  withoutHash.hash = '';
  var $refObj = this._$refs[withoutHash.format()];

  if (!$refObj) {
    throw util.newError('Error resolving $ref pointer "%s". \n"%s" not found.', $ref, pathOrUrl);
  }

  if (!pathOrUrl.hash) {
    return {
      pathOrUrl: $refObj.pathOrUrl,
      value: $refObj.value
    };
  }

  options = new Options(options);
  return $refObj.resolve(pathOrUrl, options);
};

/**
 * @param {PathOrUrl} pathOrUrl
 * @returns {$Ref|undefined}
 * @protected
 */
$Refs.prototype._get$Ref = function(pathOrUrl) {
  if (pathOrUrl.hash) {
    pathOrUrl = new PathOrUrl(pathOrUrl);
    pathOrUrl.hash = '';
  }

  return this._$refs[pathOrUrl.format()];
};

/**
 * @param {$Ref} $ref
 * @protected
 */
$Refs.prototype._set$Ref = function($ref) {
  if ($ref.pathOrUrl.hash) {
    $ref.pathOrUrl.hash = '';
    $ref.pathOrUrl = new PathOrUrl($ref.pathOrUrl.format());
  }

  $ref.$refs = this;
  this._$refs[$ref.pathOrUrl.format()] = $ref;
};
