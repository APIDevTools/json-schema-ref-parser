"use strict";
const url = require("../util/url");
const KeyGenerator = require("./util/key-generator");

function getGenericDefaults (generator) {
  return {
    defaultRoot: generator.root,

    generateKey (schema, file, hash) {
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

        return generator.generateKeyForPointer(schema, existingGeneratedKey + hash.slice(1));
      }

      if (url.isHttp(file)) {
        return generator.generateKeyForUrl(schema, file);
      }

      return generator.generateKeyForFilepath(schema, file);
    },
    shouldInline () {
      return false;
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
    generateKey (schema, file, hash) {
      if (hash !== "#" && hash !== null) {
        return defaults.generateKey(schema, file, hash.replace(/\/components\/schemas\//g, "/definitions/"));
      }

      return defaults.generateKey(schema, file, hash);
    },
    shouldInline (pathFromRoot) {
      const parsed = url.safePointerToPath(pathFromRoot);
      return parsed.length === 0 || (parsed[0] !== "definitions" && !parsed.includes("schema"));
    }
  };
};

module.exports.getDefaultsForOAS3 = function (defaults = getGenericDefaults(new KeyGenerator("#/components/schemas"))) {
  return {
    ...defaults,
    generateKey (schema, file, hash) {
      if (hash !== "#" && hash !== null) {
        return defaults.generateKey(schema, file, hash.replace(/\/definitions\//g, "/components/schemas/"));
      }

      return defaults.generateKey(schema, file, hash);
    },
    shouldInline (pathFromRoot) {
      if (pathFromRoot.startsWith("#/components/schemas")) {
        return false;
      }

      const parsed = url.safePointerToPath(pathFromRoot);

      return parsed.length === 0 || !parsed.includes("schema");
    }
  };
};

