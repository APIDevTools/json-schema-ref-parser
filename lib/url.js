'use strict';

var path      = require('path'),
    url       = require('url'),
    util      = require('./util'),
    _isString = require('lodash/lang/isString');

module.exports = Url;

function Url(u) {
  if (_isString(u)) {
    this._url = Url.parse(u);
  }
  else if (u instanceof Url) {
    this._url = url.parse(u._url.format());
  }
  else {
    this._url = url.parse(u);
  }
}

Object.defineProperty(Url.prototype, 'href', {
  get: function() {
    return this._url.href;
  }
});

['protocol', 'host', 'auth', 'hostname', 'port', 'pathname', 'search', 'path', 'query', 'hash'].forEach(
  function(prop) {
    Object.defineProperty(Url.prototype, prop, {
      enumerable: true,
      get: function() {
        return this._url[prop];
      },
      set: function(value) {
        if (value !== this._url[prop]) {
          this._url[prop] = value;
          this._url = url.parse(this._url.format());
        }
      }
    })
  }
);

Url.dirname = function() {
  return new Url.dirname();
};

Url.prototype.dirname = function() {
  return path.dirname(this.pathname);
};

Url.basename = function(ext) {
  return new Url.basename(ext);
};

Url.prototype.basename = function(ext) {
  return path.basename(this.pathname, ext);
};

Url.extname = function() {
  return new Url.extname();
};

Url.prototype.extname = function() {
  return path.extname(this.pathname);
};

Url.resolve = function(from, to) {
  return new Url(from).resolve(to);
};

Url.prototype.resolve = function(relative) {
  util.debug('Resolving path "%s", relative to "%s"', relative, this);

  if (!(relative instanceof Url)) {
    relative = new Url(relative);
  }

  // url.resolve() works across all environments (Linux, Mac, Windows, browsers),
  // even if the the URLs are different types (e.g. one is a web URL, the other is a file path)
  var u = url.resolve(this._url, relative._url);

  var resolved = new Url(u);
  util.debug('    Resolved to %s', resolved);
  return resolved;
};

Url.prototype.format = function() {
  if (process.browser || this.protocol === 'http:' || this.protocol === 'https:') {
    // It's a web URL, so return it as-is
    return this.href;
  }

  // It's a local file, so we need to do some extra work
  var pathname = this.pathname;
  var hash = this.hash;

  // Decode special characters
  pathname = decodeURIComponent(pathname);

  // Normalize slashes (uses backslashes on Windows)
  pathname = path.normalize(pathname);

  // Combine the pathname and hash (if any)
  if (hash && hash[0] === '#') {
    return pathname + hash;
  }
  else if (hash) {
    return pathname + '#' + hash;
  }
  else {
    return pathname;
  }
};

Url.prototype.toString = Url.prototype.format;

Url.parse = function(urlStr) {
  var u = url.parse(urlStr);

  if (process.browser || u.protocol === 'http:' || u.protocol === 'https:') {
    // It's a web URL, so return it as-is
    return u;
  }

  // It's a local file, so we need to do some extra work
  var pathname = urlStr;

  // Split the hash (if any) from the pathname
  var hash = urlStr.lastIndexOf('#');
  if (hash === -1) {
    hash = null;
  }
  else {
    pathname = urlStr.substr(0, hash);
    hash = urlStr.substr(hash + 1);
  }

  // Change Windows backslashes to forward slashes
  pathname = pathname.split(path.sep).join('/');

  // Encode special characters that are legal in file paths, but not in URLs
  pathname = encodeURI(pathname);

  // Parse the file path as a URL
  urlStr = url.format({pathname: pathname, hash: hash});
  u = url.parse(urlStr);

  return new Url(u);
};

/**
 * Returns the current working directory.
 * The returned path always include a trailing slash
 * to ensure that it behaves properly with {@link url#resolve}.
 *
 * @returns {Url}
 */
Url.cwd = function() {
  /* istanbul ignore next: code-coverage doesn't run in the browser */
  var dir = new Url(process.browser ? window.location.href : process.cwd() + '/');

  // Remove the file name (if any) from the pathname
  var lastSlash = dir.pathname.lastIndexOf('/');
  dir.pathname = dir.pathname.substr(0, lastSlash + 1);

  // Remove everything after the pathname
  dir.path = null;
  dir.search = null;
  dir.query = null;
  dir.hash = null;

  return new Url(dir);
};
