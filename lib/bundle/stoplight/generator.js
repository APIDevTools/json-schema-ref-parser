"use strict";

const { parse, isHttp, isFileSystemPath } = require("../../util/url");
const KeyGenerator = require("../util/key-generator");

function normalizeOpts (opts) {
  if (typeof opts.cwd === "string") {
    opts.cwd = KeyGenerator.appendSlash(opts.cwd);
  }
  else {
    opts.cwd = null;
  }

  if (typeof opts.endpointUrl === "string") {
    opts.endpointUrl = KeyGenerator.appendSlash(opts.endpointUrl);
  }
  else if (!(opts.endpointUrl instanceof RegExp)) {
    // {apiUrl}/api/v1/projects/{workspaceSlug}/{projectSlug}/nodes{+nodeUri}
    opts.endpointUrl = /\/api\/v1\/projects\/[^/]+\/[^/+]+\/nodes\/(?!$)/;
  }

  return opts;
}

function StoplightKeyGenerator (root, opts) {
  KeyGenerator.call(this, root);
  this._opts = normalizeOpts({ ...opts });
}

module.exports = StoplightKeyGenerator;

StoplightKeyGenerator.prototype = Object.create(KeyGenerator.prototype, {
  constructor: {
    configurable: true,
    writable: true,
    value: StoplightKeyGenerator,
  }
});

StoplightKeyGenerator.prototype.processPath = function (path) {
  if (isHttp(path)) {
    return this.extractFilepathFromUrl(path);
  }

  let { cwd } = this._opts;

  if (path.indexOf(cwd) === 0) {
    // filesystem, file in the same project
    return path.slice(cwd.length);
  }

  return path;
};

StoplightKeyGenerator.prototype.extractFilepathFromUrl = function (url) {
  let { endpointUrl } = this._opts;
  let { pathname, href, query } = parse(url, true);

  if (pathname === "/" || pathname === null) {
    return url;
  }

  let mid = query.mid ? `_m${query.mid}` : "";

  let filepath;

  if (endpointUrl instanceof RegExp) {
    [, filepath] = pathname.split(endpointUrl);
  }
  else if (href.indexOf(endpointUrl) === 0) {
    filepath = href.slice(endpointUrl.length);
  }

  if (filepath) {
    return filepath + mid;
  }

  return url;
};

StoplightKeyGenerator.prototype.generateKeyForFilepath = function (schema, filepath, pathFromRoot) {
  return KeyGenerator.prototype.generateKeyForFilepath.call(this, schema, this.processPath(filepath), pathFromRoot);
};

StoplightKeyGenerator.prototype.hasExistingGeneratedKey = function (schema, id) {
  if (isHttp(id) || isFileSystemPath(id)) {
    return KeyGenerator.prototype.hasExistingGeneratedKey.call(this, schema, this.processPath(id));
  }

  return KeyGenerator.prototype.hasExistingGeneratedKey.call(this, schema, id);
};

StoplightKeyGenerator.prototype.getExistingGeneratedKey = function (schema, id) {
  if (isHttp(id) || isFileSystemPath(id)) {
    return KeyGenerator.prototype.getExistingGeneratedKey.call(this, schema, this.processPath(id));
  }

  return KeyGenerator.prototype.getExistingGeneratedKey.call(this, schema, id);
};

StoplightKeyGenerator.prototype.generateKeyForUrl = function (schema, url, pathFromRoot) {
  let existingGeneratedKey = this.getExistingGeneratedKey(schema, url);

  if (existingGeneratedKey !== undefined) {
    return existingGeneratedKey;
  }

  try {
    let { href, query } = parse(url, true);
    let filepath = this.extractFilepathFromUrl(href);

    if (filepath !== href) {
      let existingKey = this.getExistingGeneratedKey(schema, filepath);

      if (existingKey !== undefined) {
        return existingKey;
      }

      let key = this.getPrettifiedKeyForFilepath(filepath.replace(/_m[0-9]+$/, ""));

      if (query.mid && this.isKeyTaken(schema, key, pathFromRoot)) {
        key = this.generateUniqueKey(schema, `${key}_m${query.mid}`, pathFromRoot);
      }
      else {
        key = this.generateUniqueKey(schema, key, pathFromRoot);
      }

      let generatedKey = this.registerNewGeneratedKey(schema, url, key, pathFromRoot);

      // https://example.com/api/nodes.raw/?srn=org/proj/data-model-dictionary/reference/book.yaml and filepath from the same project
      // should be considered the same source, hence this extra registration call here
      // query.mid appended because mid does affect the way we treat the source
      this.registerNewGeneratedKey(schema, filepath, key, pathFromRoot);
      return generatedKey;
    }
  }
  catch {
    //
  }

  return null;
};
