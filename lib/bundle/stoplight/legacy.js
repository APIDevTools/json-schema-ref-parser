"use strict";

const { join, stripRoot } = require("@stoplight/path");
const StoplightKeyGenerator = require("./generator");
const { parse, isHttp, isFileSystemPath } = require("../../util/url");
const {
  getGenericDefaults,
  getDefaultsForOldJsonSchema,
  getDefaultsForOAS2,
  getDefaultsForOAS3,
} = require("../defaults");

function LegacyStoplightKeyGenerator (root, opts) {
  StoplightKeyGenerator.call(this, root, opts);
}

LegacyStoplightKeyGenerator.prototype = Object.create(StoplightKeyGenerator.prototype, {
  constructor: {
    configurable: true,
    writable: true,
    value: LegacyStoplightKeyGenerator,
  }
});

LegacyStoplightKeyGenerator.prototype.processPath = function (path) {
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

LegacyStoplightKeyGenerator.prototype.extractFilepathFromUrl = function (url) {
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

module.exports = function (opts) {
  return {
    get oas2 () {
      return getDefaultsForOAS2(getGenericDefaults(new LegacyStoplightKeyGenerator("#/definitions", opts)));
    },
    get oas3 () {
      return getDefaultsForOAS3(getGenericDefaults(new LegacyStoplightKeyGenerator("#/components/schemas", opts)));
    },
    // eslint-disable-next-line camelcase
    get json_schema () {
      return getDefaultsForOldJsonSchema(getGenericDefaults(new LegacyStoplightKeyGenerator("#/definitions", opts)));
    },
  };
};
