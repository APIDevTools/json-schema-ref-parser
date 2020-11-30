"use strict";

const { safePointerToPath, parse } = require("../../util/url");
const { basename, extname } = require("@stoplight/path");
const { get } = require("./object");

const MAX_ATTEMPTS = 10000;

function isVersionId (str, letter, i) {
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
}

function capitalize (name) {
  return name[0].toUpperCase() + name.slice(1);
}

function prettify (name) {
  return capitalize(name.replace(/(?:\.|[\\/]+)(mid|[a-z])?/g, (_, letter, i) => {
    if (isVersionId(name, letter, i)) {
      return `.${letter}`;
    }

    if (letter === "mid") {
      return "_m";
    }

    return letter === undefined ? i === 0 ? "" : "_" : `_${letter.toUpperCase()}`;
  }));
}

function suggestName (root, takenKeys, name) {
  let suggestedName = name;
  let i = 2;
  while ((root && suggestedName in root) || takenKeys.has(suggestedName)) {
    suggestedName = `${name}_${i++}`;
    if (i > MAX_ATTEMPTS) {
      throw new Error(`suggestName: MAX_ATTEMPTS exceeded. Names ${name}_2 through ${name}_${MAX_ATTEMPTS} already taken.`);
    }
  }

  return suggestedName;
}

module.exports = function (root) {
  let computed = {};
  let takenKeys = new Set();
  let parsedRoot = safePointerToPath(root);
  let schemaRoot;

  return {
    getExistingSuggestion (id) {
      return computed[id];
    },

    suggestNameForFilePath (schema, filepath) {
      if (!computed[filepath]) {
        if (!schemaRoot) {
          schemaRoot = get(schema, root);
        }

        let name = suggestName(schemaRoot, takenKeys, prettify(basename(filepath, extname(filepath))));
        takenKeys.add(name);
        computed[filepath] = `${root}/${name}`;
      }

      return computed[filepath];
    },

    suggestNameForUrl (schema, url) {
      if (!computed[url]) {
        try {
          const { href } = parse(url, true);
          computed[url] = this.suggestNameForFilePath(schema, href);
        }
        catch {
          computed[url] = null;
        }
      }

      return computed[url];
    },

    isInRoot (pointer) {
      let parsedPointer = safePointerToPath(pointer);

      if (parsedRoot.length >= parsedPointer.length) {
        return false;
      }

      for (let i = parsedRoot.length - 1; i >= 0; i--) {
        if (parsedPointer[parsedPointer.length - (parsedRoot.length - i) - 1] !== parsedRoot[i]) {
          return false;
        }
      }

      return true;
    },

    suggestNameForPointer (schema, pointer) {
      if (!computed[pointer]) {
        if (!schemaRoot) {
          schemaRoot = get(schema, root);
        }

        let actualPath = pointer.split(root.slice(1)).slice(1);
        let name = suggestName(schemaRoot, takenKeys, prettify(actualPath.join("/")));

        takenKeys.add(name);
        computed[pointer] = `${root}/${name}`;
      }

      return computed[pointer];
    }
  };
};
