"use strict";

const {
  getGenericDefaults,
  getDefaultsForOldJsonSchema,
  getDefaultsForOAS2,
  getDefaultsForOAS3,
} = require("../defaults");
const StoplightKeyGenerator = require("./generator");

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
