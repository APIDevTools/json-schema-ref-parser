'use strict';

var META_SYMBOL = typeof Symbol === "function" ? Symbol('json-schema-ref-parser metadata') : "__metadata";

/**
 * Safely sets meta property on the given object value
 *
 * @param  {object} obj - A object to set meta info on
 * @param  {string} prop - Name of property
 * @param  {string} prop - Value to set
 */
exports.setMetadata = function (obj, value) {
  if (!obj) { return; }
  // we can't create property on primitives (throws in strict mode)
  if (typeof obj !== 'object') { return; }

  obj[META_SYMBOL] = value;
};

/**
 * Given the any object returns the associated meta-information or undefined
 *
 * @param  {any} value - object to get the meta from
 * @returns {{pointer: string}}
 */
exports.getMetadata = function (value) {
  return value && value[META_SYMBOL];
};
