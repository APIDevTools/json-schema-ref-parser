"use strict";

const Pointer = require("../../pointer");

/**
 * @param {object} obj
 * @param {string} pointer
 */
module.exports.get = function (obj, pointer) {
  let tokens = Pointer.parse(pointer);

  if (tokens.length === 0) {
    throw new TypeError("Path cannot point at root");
  }

  let curObj = obj;
  for (let i = 0; i < tokens.length - 1; i++) {
    let segment = tokens[i];

    curObj = curObj[segment];

    if (typeof curObj !== "object" || curObj === null) {
      return;
    }
  }

  return curObj[tokens[tokens.length - 1]];
};

/**
 * @param {object} obj
 * @param {string} pointer
 * @param {*} value
 */
module.exports.set = function (obj, pointer, value) {
  let tokens = Pointer.parse(pointer);

  if (tokens.length === 0) {
    throw new TypeError("Path cannot point at root");
  }

  let curObj = obj;
  for (let i = 0; i < tokens.length - 1; i++) {
    let segment = tokens[i];
    let prevObj = curObj;

    curObj = curObj[segment];

    if (typeof curObj !== "object" || curObj === null) {
      curObj = prevObj[segment] = {};
    }
  }

  if (!(tokens[tokens.length - 1] in curObj)) {
    curObj[tokens[tokens.length - 1]] = value;
  }
};

