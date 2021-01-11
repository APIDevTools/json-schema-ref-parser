"use strict";

const { parse, isHttp, isFileSystemPath } = require("../../util/url");
const KeyGenerator = require("../util/key-generator");

function normalizeOpts (opts) {
  if (typeof opts.cwd === "string") {
    opts.cwd = StoplightKeyGenerator.appendSlash(opts.cwd);
  }
  else {
    opts.cwd = null;
  }

  if (typeof opts.endpointUrl === "string") {
    opts.endpointUrl = StoplightKeyGenerator.appendSlash(opts.endpointUrl);
  }
  else {
    opts.endpointUrl = null;
  }

  return opts;
}

function StoplightKeyGenerator (root, opts) {
  KeyGenerator.call(this, root);
  this._opts = normalizeOpts({ ...opts });
}

StoplightKeyGenerator.appendSlash = function (str) {
  return str.replace(/([^/])\/?$/, "$1/");
};

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
  let { href, query } = parse(url, true);

  let mid = query.mid ? `_m${query.mid}` : "";

  if (href.indexOf(endpointUrl) === 0) {
    return href.slice(endpointUrl.length) + mid;
  }

  return url;
};

StoplightKeyGenerator.prototype.generateKeyForFilepath = function (schema, filepath) {
  return KeyGenerator.prototype.generateKeyForFilepath.call(this, schema, this.processPath(filepath));
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

StoplightKeyGenerator.prototype.generateKeyForUrl = function (schema, url) {
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

      if (query.mid && this.isKeyTaken(schema, key)) {
        key = this.generateUniqueKey(schema, `${key}_m${query.mid}`);
      }
      else {
        key = this.generateUniqueKey(schema, key);
      }

      let generatedKey = this.registerNewGeneratedKey(schema, url, key);

      // https://example.com/api/nodes.raw/?srn=org/proj/data-model-dictionary/reference/book.yaml and filepath from the same project
      // should be considered the same source, hence this extra registration call here
      // query.mid appended because mid does affect the way we treat the source
      this.registerNewGeneratedKey(schema, filepath, key);
      return generatedKey;
    }
  }
  catch {
    //
  }

  return null;
};
