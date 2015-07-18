'use strict';

var path      = require('path'),
    url       = require('url'),
    util      = require('./util'),
    _isString = require('lodash/lang/isString'),
    isWindows = /^win/.test(process.platform);

module.exports = PathOrUrl;

/**
 * @param {string|Url|PathOrUrl} href
 * @param {{allowFileQuery: boolean, allowFileHash: boolean}} [options]
 * @constructor
 */
function PathOrUrl(href, options) {
  this.isUrl = false;
  this.isFile = false;
  this.href = '';
  this.protocol = '';
  this.slashes = false;
  this.auth = '';
  this.host = '';
  this.hostname = '';
  this.port = '';
  this.path = '';
  this.pathname = '';
  this.root = '';
  this.dir = '';
  this.base = '';
  this.name = '';
  this.ext = '';
  this.search = '';
  this.query = '';
  this.hash = '';

  if (_isString(href)) {
    this.parse(href, options);
  }
  else if (href instanceof url.Url) {
    this.parse(href.format(), options);
  }
  else if (href instanceof PathOrUrl) {
    copy(href, this);
  }
  else {
    throw util.newError('Expected a file path or URL, but got %s', href);
  }
}

PathOrUrl.dirname = function(href, options) {
  return new PathOrUrl(href, options).dirname();
};

PathOrUrl.prototype.dirname = function() {
  return this.dir;
};

PathOrUrl.basename = function(href, options, ext) {
  if (_isString(options)) {
    ext = options;
    options = undefined;
  }
  return new PathOrUrl(href, options).basename(ext);
};

PathOrUrl.prototype.basename = function(ext) {
  if (ext && this.ext === ext) {
    return this.name;
  }
  else {
    return this.base;
  }
};

PathOrUrl.extname = function(href, options) {
  return new PathOrUrl(href, options);
};

PathOrUrl.prototype.extname = function() {
  return this.ext;
};

PathOrUrl.resolve = function(from, to, options) {
  return new PathOrUrl(from, options).resolve(to, options);
};

PathOrUrl.prototype.resolve = function(relative, options) {
  var resolved;

  if (relative instanceof PathOrUrl) {
    // PathOrUrl objects are always absolute, so just return it as-is
    resolved = relative.format();
  }
  else if (this.isUrl || relative instanceof url.Url) {
    // Resolve as a URL
    relative = url.parse(relative);
    util.debug('Resolving path "%s", relative to "%s"', relative.href, this);
    var selfUrl = this.toUrl();
    resolved = selfUrl.resolve(relative);
    util.debug('    Resolved to %s', resolved);
  }
  else {
    // Resolve as a file path
    util.debug('Resolving path "%s", relative to "%s"', relative, this);
    relative = parseFile({}, relative, options);
    relative.path = relative.root = relative.dir = relative.base = relative.name = relative.ext = '';
    if (relative.pathname) {
      relative.pathname = path.resolve(this.dir, relative.pathname);
    }
    else {
      relative.pathname = this.pathname;
      relative.search = relative.search || this.search;
      relative.query = relative.query || this.query;
      relative.hash = relative.hash || this.hash;
    }
    resolved = PathOrUrl.prototype.format.call(relative);
    util.debug('    Resolved to %s', resolved);
  }

  return resolved;
};

PathOrUrl.format = function(href, options) {
  return new PathOrUrl(href, options).format();
};

PathOrUrl.prototype.format = function() {
  var clone = copy(this, {});

  // Build the `pathname` property
  if (clone.dir || clone.base || clone.name || clone.ext) {
    var sep = clone.isFile ? path.sep : '/';
    clone.base = clone.base || (clone.name + clone.ext) || '';
    if (clone.base[0] === sep) {
      clone.base = clone.base.substr(1);
    }
    clone.dir = clone.dir || '';
    if (clone.dir.substr(-1) === sep) {
      clone.pathname = clone.dir + clone.base;
    }
    else {
      clone.pathname = clone.dir + sep + clone.base;
    }
  }

  if (clone.isUrl) {
    // Format as a URL
    return url.format(clone);
  }

  // If the file has a query, then build the `search` property
  if (clone.query) {
    clone.search = '?' + clone.query;
  }
  else if (clone.search && clone.search[0] !== '?') {
    clone.search = '?' + clone.search;
  }

  // If the file has a hash, then format the `hash` property
  if (clone.hash && clone.hash[0] !== '#') {
    clone.hash = '#' + clone.hash;
  }

  // Format as a file path
  return path.normalize(clone.pathname + clone.search + clone.hash);
};

PathOrUrl.prototype.toString = function() {
  return this.href;
};

PathOrUrl.toUrl = function(href, options) {
  return new PathOrUrl(href, options).toUrl();
};

PathOrUrl.prototype.toUrl = function() {
  return url.parse(this.toUrlString());
};

PathOrUrl.toUrlString = function(href, options) {
  return new PathOrUrl(href, options).toUrlString();
};

PathOrUrl.prototype.toUrlString = function() {
  if (this.isUrl) {
    return url.format(this);
  }
  else {
    var pathname = this.pathname;

    // Normalize path separators (e.g. Windows backslashes)
    if (path.sep !== '/') {
      pathname = pathname.replace(new RegExp(path.sep, 'g'), '/');
    }

    return url.format({
      protocol: 'file:',
      slashes: true,
      pathname: pathname,
      search: this.search,
      hash: this.hash
    });
  }
};

/**
 * Returns the current working directory as a {@link PathOrUrl} object.
 * The returned path always includes a trailing slash,
 * which ensures that it behaves properly with methods like {@link url#resolve}.
 *
 * @returns {PathOrUrl}
 */
PathOrUrl.cwd = function() {
  var cwd;

  if (process.browser) {
    var page = window.location.href;
    var lastSlash = page.lastIndexOf('/');
    cwd = page.substr(0, lastSlash + 1);
  }
  else {
    cwd = process.cwd() + path.sep;
  }

  return new PathOrUrl(cwd);
};

PathOrUrl.parse = function(href, options) {
  return new PathOrUrl(href, options);
};

/**
 * @param {string} href
 * @param {{allowFileQuery: boolean, allowFileHash: boolean}} [options]
 */
PathOrUrl.prototype.parse = function(href, options) {
  if (process.browser) {
    // We're running in a browser, so treat all paths as a URLs
    parseUrl(this, url.parse(url.resolve(window.location.href, href)));
  }
  else if (getRoot(href)) {
    // It's an absolute file path
    parseFile(this, href, options);
  }
  else {
    var u = url.parse(href);
    if (u.protocol) {
      // It's a full URL (e.g. https://host.com)
      parseUrl(this, u);
    }
    else {
      // It's a relative file path
      parseFile(this, path.resolve(process.cwd(), href), options);
    }
  }
};

/**
 * @param {PathOrUrl} target
 * @param {Url} url
 */
function parseUrl(target, url) {
  var file = {};
  if (url.pathname) {
    parseFile(file, url.pathname);
  }

  target.isUrl = true;
  target.isFile = false;
  target.href = url.href || '';
  target.protocol = url.protocol || '';
  target.slashes = url.slashes || false;
  target.auth = url.auth || '';
  target.host = url.host || '';
  target.hostname = url.hostname || '';
  target.port = url.port || '';
  target.path = url.path || '';
  target.pathname = url.pathname || '';
  target.root = file.root || '';
  target.dir = file.dir || '';
  target.base = file.base || '';
  target.name = file.name || '';
  target.ext = file.ext || '';
  target.search = url.search || '';
  target.query = url.query || '';
  target.hash = url.hash || '';
  return target;
}

/**
 * @param {PathOrUrl} target
 * @param {string} file
 * @param {{allowFileQuery: boolean, allowFileHash: boolean}} [options]
 * @returns {{isUrl: boolean, isFile: boolean, url: Url, path: Path}}
 */
function parseFile(target, file, options) {
  var hash = '', query = '', href = file;
  options = options || {};

  if (options.allowFileHash) {
    // Separate the hash from the file path
    var hashIndex = file.indexOf('#');
    if (hashIndex >= 0) {
      hash = file.substr(hashIndex);
      file = file.substr(0, hashIndex);
    }
  }

  if (options.allowFileQuery) {
    // Separate the query from the file path
    var queryIndex = file.lastIndexOf('?');
    if (queryIndex >= 0) {
      query = file.substr(queryIndex + 1);
      file = file.substr(0, queryIndex);
    }
  }

  // Parse the file path
  var dir, base, name, ext;
  if (file.substr(-1) === '/' || file.substr(-1) === path.sep) {
    // It's a directory
    dir = file.substr(0, file.length - 1);
    base = name = ext = '';
  }
  else {
    // It's a file
    dir = path.dirname(file);
    base = path.basename(file);
    ext = path.extname(file);
    name = path.basename(file, ext);
  }

  target.isUrl = false;
  target.isFile = true;
  target.href = href || '';
  target.protocol = '';
  target.slashes = false;
  target.auth = '';
  target.host = '';
  target.hostname = '';
  target.port = '';
  target.path = file + (query ? '?' + query : '');
  target.pathname = file;
  target.root = getRoot(file);
  target.dir = dir;
  target.base = base;
  target.name = name;
  target.ext = ext;
  target.search = query ? '?' + query : '';
  target.query = query;
  target.hash = hash;
  return target;
}

/**
 * @param {PathOrUrl} src
 * @param {PathOrUrl} dest
 * @returns {PathOrUrl}
 */
function copy(src, dest) {
  dest.isUrl = src.isUrl;
  dest.isFile = src.isFile;
  dest.href = src.href;
  dest.protocol = src.protocol;
  dest.slashes = src.slashes;
  dest.auth = src.auth;
  dest.host = src.host;
  dest.hostname = src.hostname;
  dest.port = src.port;
  dest.path = src.path;
  dest.pathname = src.pathname;
  dest.root = src.root;
  dest.dir = src.dir;
  dest.base = src.base;
  dest.name = src.name;
  dest.ext = src.ext;
  dest.search = src.search;
  dest.query = src.query;
  dest.hash = src.hash;
  return dest;
}

function getRoot(dir) {
  if (dir[0] === '/') {
    return '/';
  }
  else if (isWindows && dir.substr(1, 2) === ':\\') {
    return dir.substr(0, 3);
  }
  else {
    return '';
  }
}
