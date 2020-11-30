"use strict";
const url = require("../util/url");
const createSuggester = require("./util/suggestName");

function generateBase (defaultRoot, opts) {
  let suggestions = createSuggester(defaultRoot);

  return {
    defaultRoot,

    generateKey (schema, file, hash) {
      if (!url.isFileSystemPath(file) && !url.isHttp(file)) {
        return null;
      }

      if (opts && typeof opts.preprocessFilepath === "function") {
        file = opts.preprocessFilepath(file);
      }

      if (hash !== "#" && hash !== null) {
        let existingSuggestion = suggestions.getExistingSuggestion(file);

        if (existingSuggestion === null) {
          return null;
        }

        if (!suggestions.isInRoot(hash)) {
          return null;
        }

        return suggestions.suggestNameForPointer(schema, existingSuggestion + hash.slice(1));
      }

      if (url.isHttp(file)) {
        return suggestions.suggestNameForUrl(schema, file);
      }

      return suggestions.suggestNameForFilePath(schema, file);
    },
    shouldInline () {
      return false;
    },
  };
}

module.exports.getDefaultsForOldJsonSchema = function (opts) {
  return generateBase("#/definitions", opts);
};

module.exports.getDefaultsForNewJsonSchema = function (opts) {
  return generateBase("#/$defs", opts);
};

module.exports.getDefaultsForOAS2 = function (opts) {
  let base = generateBase("#/definitions", opts);

  return {
    ...base,
    generateKey (schema, file, hash) {
      if (hash !== "#" && hash !== null) {
        return base.generateKey(schema, file, hash.replace(/\/components\/schemas\//g, "/definitions/"));
      }

      return base.generateKey(schema, file, hash);
    },
    shouldInline (pathFromRoot) {
      const parsed = url.safePointerToPath(pathFromRoot);
      return parsed.length === 0 || (parsed[0] !== "definitions" && !parsed.includes("schema"));
    }
  };
};

module.exports.getDefaultsForOAS3 = function (opts) {
  let base = generateBase("#/components/schemas", opts);

  return {
    ...base,
    generateKey (schema, file, hash) {
      if (hash !== "#" && hash !== null) {
        return base.generateKey(schema, file, hash.replace(/\/definitions\//g, "/components/schemas/"));
      }

      return base.generateKey(schema, file, hash);
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

