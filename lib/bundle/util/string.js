"use strict";

module.exports.isVersionId = function isVersionId (str, letter, i) {
  if (letter !== "v") {
    return false;
  }

  i += 2;

  for (; i < str.length; i++) {
    if (!Number.isNaN(Number(str[i]))) {
      continue;
    }

    if (str[i] === ".") {
      return true;
    }
  }

  return str.length === i;
};

module.exports.capitalize = function capitalize (str) {
  return str[0].toUpperCase() + str.slice(1);
};
