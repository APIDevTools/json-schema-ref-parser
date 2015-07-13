'use strict';

var _merge     = require('lodash/object/merge'),
    _cloneDeep = require('lodash/lang/cloneDeep');

module.exports = Options;

function Options(options) {
  _merge(this, _cloneDeep(Options.prototype), options);
}

Options.prototype.allow = {
  json: true,
  yaml: true,
  empty: true,
  unknown: true
};

Options.prototype.$refs = {
  internal: true,
  external: true
};

Options.prototype.cache = {
  fs: 60,
  http: 5 * 60,
  https: 5 * 60
};
