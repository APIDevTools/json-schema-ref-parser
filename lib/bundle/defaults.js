"use strict";
const url = require("../util/url");
const KeyGenerator = require("./util/key-generator");

function getGenericDefaults (generator) {
  return {
    defaultRoot: generator.root,

    generateKey (schema, file, hash, pathFromRoot) {
      if (generator.isUnderDirectRoot(pathFromRoot)) {
        return null;
      }

      if (!url.isFileSystemPath(file) && !url.isHttp(file)) {
        return null;
      }

      if (hash !== "#" && hash !== null) {
        let existingGeneratedKey = generator.getExistingGeneratedKey(schema, file);

        if (existingGeneratedKey === null) {
          return null;
        }

        if (!generator.isInRoot(hash)) {
          return null;
        }

        return generator.generateKeyForPointer(schema, existingGeneratedKey === undefined ? pathFromRoot : existingGeneratedKey + hash.slice(1));
      }

      if (url.isHttp(file)) {
        return generator.generateKeyForUrl(schema, file);
      }

      return generator.generateKeyForFilepath(schema, file);
    },
  };
}

module.exports.getGenericDefaults = getGenericDefaults;

module.exports.getDefaultsForOldJsonSchema = function (defaults = getGenericDefaults(new KeyGenerator("#/definitions"))) {
  return defaults;
};

module.exports.getDefaultsForNewJsonSchema = function (defaults = getGenericDefaults(new KeyGenerator("#/$defs"))) {
  return defaults;
};

module.exports.getDefaultsForOAS2 = function (defaults = getGenericDefaults(new KeyGenerator("#/definitions"))) {
  return {
    ...defaults,
    generateKey (schema, file, hash, pathFromRoot) {
      pathFromRoot = normalizeOasSchemasHash(pathFromRoot, defaults.defaultRoot);

      if (!pathFromRoot.startsWith(defaults.defaultRoot) && !isSchemaPlacement(pathFromRoot.split("/"))) {
        return null;
      }

      if (hash !== "#" && hash !== null) {
        return defaults.generateKey(schema, file, normalizeOasSchemasHash(hash, defaults.defaultRoot), pathFromRoot);
      }

      return defaults.generateKey(schema, file, hash, pathFromRoot);
    },
  };
};

module.exports.getDefaultsForOAS3 = function (defaults = getGenericDefaults(new KeyGenerator("#/components/schemas"))) {
  return module.exports.getDefaultsForOAS2(defaults);
};

function normalizeOasSchemasHash (hash, root) {
  return hash.replace(/\/(?:components\/schemas|definitions)\//g, root.slice(1) + "/");
}

// this should return true for every place in a OAS document that can reference a JSON Schema model
function isSchemaPlacement (path) {
  if (isInOasOperation(path) && path.includes("schema")) {
    return true;
  }

  return false;
}

function isInOasOperation (path) {
  return path.length > 3 && path[1] === "paths";
}
