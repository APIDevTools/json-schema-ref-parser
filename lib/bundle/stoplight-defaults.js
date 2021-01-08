"use strict";

const { join, stripRoot } = require("@stoplight/path");
const {
  getGenericDefaults,
  getDefaultsForOldJsonSchema,
  getDefaultsForOAS2,
  getDefaultsForOAS3,
} = require("./defaults");
const { parse, isHttp, isFileSystemPath } = require("../util/url");
const KeyGenerator = require("./util/key-generator");

function StoplightKeyGenerator (root, opts) {
  KeyGenerator.call(this, root);
  this._opts = opts;
}

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

  let { srn, cwd } = this._opts;

  if (srn !== null && cwd !== null && isFileSystemPath(path) && path.indexOf(cwd) === 0) {
    // filesystem, file in the same project
    return join(srn, stripRoot(path.slice(cwd.length)));
  }

  return path;
};

StoplightKeyGenerator.prototype.extractFilepathFromUrl = function (url) {
  let { endpointUrl, cwd } = this._opts;
  let { href, query } = parse(url, true);

  let mid = query.mid ? `_m${query.mid}` : "";

  if (typeof query.srn === "string") {
    // this is for v1 (srn)
    return query.srn + mid;
  }

  if (endpointUrl !== null && href.indexOf(endpointUrl) === 0) {
    // this is for v1 (href)
    return href.slice(endpointUrl.length) + mid;
  }

  // this is mostly for the sake of Karma... but might be useful for us, one day. Perhaps.
  if (cwd !== null && isHttp(cwd) && href.indexOf(cwd) === 0) {
    return href.slice(cwd.length);
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

      // https://example.com/api/nodes.raw/?srn=org/proj/data-model-dictionary/reference/book.yaml and "https://example.com/api/nodes.raw/org/proj/data-model-dictionary/reference/book.yaml
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

module.exports = function (opts) {
  return {
    get oas2 () {
      return getDefaultsForOAS2(getGenericDefaults(new StoplightKeyGenerator("#/definitions", opts)));
    },
    get oas3 () {
      return getDefaultsForOAS3(getGenericDefaults(new StoplightKeyGenerator("#/components/schemas", opts)));
    },
    // eslint-disable-next-line camelcase
    get json_schema () {
      return getDefaultsForOldJsonSchema(getGenericDefaults(new StoplightKeyGenerator("#/definitions", opts)));
    },
  };
};
