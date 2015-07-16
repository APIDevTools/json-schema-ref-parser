'use strict';

var _merge = require('lodash/object/merge');

module.exports = Options;

function Options(options) {
  this.allow = {
    json: true,
    yaml: true,
    empty: true,
    unknown: true
  };

  this.$refs = {
    internal: true,
    external: true
  };

  this.cache = {
    fs: 60,
    http: 5 * 60,
    https: 5 * 60
  };

  _merge(this, options);
}
