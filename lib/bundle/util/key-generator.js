"use strict";

const { capitalize, isVersionId } = require("./string");
const { safePointerToPath, parse } = require("../../util/url");
const { basename, extname } = require("@stoplight/path");
const { get } = require("./object");

const MAX_ATTEMPTS = 20;

function prettify (key) {
  return capitalize(key.replace(/(?:\.|[\\/]+)([a-z])?/g, (_, letter, i) => {
    if (isVersionId(key, letter, i)) {
      return `.${letter}`;
    }

    return letter === undefined ? i === 0 ? "" : "_" : `_${letter.toUpperCase()}`;
  }));
}

function suggestKey (takenKeys, key) {
  let suggestedKey = key;
  let i = 2;
  while (takenKeys.has(suggestedKey)) {
    suggestedKey = `${key}_${i++}`;
    if (i > MAX_ATTEMPTS) {
      throw new Error(`suggestKey: MAX_ATTEMPTS exceeded. Keys ${key}_2 through ${key}_${MAX_ATTEMPTS} already taken.`);
    }
  }

  return suggestedKey;
}

KeyGenerator.suggestKey = suggestKey;

KeyGenerator.appendSlash = function (str) {
  return str.replace(/([^/])\/?$/, "$1/");
};

function KeyGenerator (root) {
  this.root = root;
  this._parsedRoot = safePointerToPath(root);
  this._seenSchemas = new WeakMap();
}

module.exports = KeyGenerator;

Object.assign(KeyGenerator.prototype, {
  _initializeOrReuseStateForSchema (schema) {
    let existingEntry = this._seenSchemas.get(schema);
    if (existingEntry) {
      return {
        state: existingEntry,
        reused: false,
      };
    }

    let state = {
      takenKeys: new Set(),
      generatedKeys: new Map(),
    };

    this._seenSchemas.set(schema, state);

    return {
      state,
      reused: false,
    };
  },

  getTakenKeys (schema) {
    let { state, reused } = this._initializeOrReuseStateForSchema(schema);

    if (!reused) {
      let schemaRoot = get(schema, this.root);

      if (typeof schemaRoot === "object" && schemaRoot !== null) {
        for (let key of Object.keys(schemaRoot)) {
          state.takenKeys.add(key);
        }
      }
    }

    return state.takenKeys;
  },

  isKeyTaken (schema, key) {
    return this.getTakenKeys(schema).has(key);
  },

  getGeneratedKeys (schema) {
    return this._initializeOrReuseStateForSchema(schema).state.generatedKeys;
  },

  getExistingGeneratedKey (schema, id) {
    return this.getGeneratedKeys(schema)[id];
  },

  hasExistingGeneratedKey (schema, id) {
    return id in this.getGeneratedKeys(schema);
  },

  registerNewGeneratedKey (schema, id, key) {
    let generatedKeys = this.getGeneratedKeys(schema);

    if (key === null) {
      generatedKeys[id] = key;
    }
    else {
      let takenKeys = this.getTakenKeys(schema);

      takenKeys.add(key);
      generatedKeys[id] = `${this.root}/${key}`;
    }

    return generatedKeys[id];
  },

  getPrettifiedKeyForFilepath (filepath) {
    return prettify(basename(filepath, extname(filepath)));
  },

  generateUniqueKey (schema, key) {
    return suggestKey(this.getTakenKeys(schema), key);
  },

  generateKeyForFilepath (schema, filepath) {
    if (!this.hasExistingGeneratedKey(schema, filepath)) {
      let key = this.generateUniqueKey(schema, this.getPrettifiedKeyForFilepath(filepath));

      this.registerNewGeneratedKey(schema, filepath, key);
    }

    return this.getExistingGeneratedKey(schema, filepath);
  },

  generateKeyForUrl (schema, url) {
    if (!this.hasExistingGeneratedKey(schema, url)) {
      let { path } = parse(url, true);
      let key = path === "/" ? null : this.generateUniqueKey(schema, this.getPrettifiedKeyForFilepath(path));

      this.registerNewGeneratedKey(schema, url, key);
    }

    return this.getExistingGeneratedKey(schema, url);
  },

  generateKeyForPointer (schema, pointer) {
    if (!this.hasExistingGeneratedKey(schema, pointer)) {
      let fragment = KeyGenerator.appendSlash(this.root.slice(1));
      let actualPath = pointer.split(fragment).slice(1);
      let key = this.generateUniqueKey(schema, prettify(actualPath.join("/")));

      this.registerNewGeneratedKey(schema, pointer, key);
    }

    return this.getExistingGeneratedKey(schema, pointer);
  },

  isInRoot (pointer) {
    let parsedPointer = safePointerToPath(pointer);

    if (this._parsedRoot.length >= parsedPointer.length) {
      return false;
    }

    for (let i = this._parsedRoot.length - 1; i >= 0; i--) {
      if (parsedPointer[parsedPointer.length - (this._parsedRoot.length - i) - 1] !== this._parsedRoot[i]) {
        return false;
      }
    }

    return true;
  },

  isUnderDirectRoot (pointer) {
    let parsedPointer = safePointerToPath(pointer);

    if (parsedPointer.length !== this._parsedRoot.length + 1) {
      return false;
    }

    return this.isInRoot(pointer);
  }
});
