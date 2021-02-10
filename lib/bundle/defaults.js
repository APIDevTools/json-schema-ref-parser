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

        if (existingGeneratedKey === undefined) {
          existingGeneratedKey = generator.generateKeyForFilepath(schema, file, pathFromRoot);
        }

        if (existingGeneratedKey === null) {
          return null;
        }

        if (!generator.isInRoot(hash, pathFromRoot)) {
          return null;
        }

        return generator.generateKeyForPointer(schema, existingGeneratedKey + hash.slice(1), pathFromRoot);
      }

      if (url.isHttp(file)) {
        return generator.generateKeyForUrl(schema, file, pathFromRoot);
      }

      return generator.generateKeyForFilepath(schema, file, pathFromRoot);
    },
  };
}

module.exports.getGenericDefaults = getGenericDefaults;

module.exports.getDefaultsForOldJsonSchema = function (defaults = getGenericDefaults(new KeyGenerator(() => "#/definitions"))) {
  return defaults;
};

module.exports.getDefaultsForNewJsonSchema = function (defaults = getGenericDefaults(new KeyGenerator(() => "#/$defs"))) {
  return defaults;
};

const defaultOas2RootResolver = (pathFromRoot) => {
  const pathParsed = pathFromRoot.split("/");

  if (canReferenceParameter(pathParsed)) {
    return "#/parameters";
  }
  if (canReferenceResponse(pathParsed)) {
    return "#/responses";
  }
  if (canReferenceSchema(pathParsed)) {
    return "#/definitions";
  }

  return null;
};

const defaultOas3RootResolver = (pathFromRoot) => {
  const pathParsed = pathFromRoot.split("/");

  if (canReferenceParameter(pathParsed)) {
    return "#/components/parameters";
  }
  if (canReferenceResponse(pathParsed)) {
    return "#/components/responses";
  }
  if (canReferenceRequestBody(pathParsed)) {
    return "#/components/requestBodies";
  }
  if (canReferenceHeader(pathParsed)) {
    return "#/components/headers";
  }
  if (canReferenceSchema(pathParsed)) {
    return "#/components/schemas";
  }

  return null;
};

module.exports.defaultOas2RootResolver = defaultOas2RootResolver;
module.exports.defaultOas3RootResolver = defaultOas3RootResolver;

module.exports.getDefaultsForOAS2 = function (defaults = getGenericDefaults(new KeyGenerator(module.exports.defaultOas2RootResolver))) {
  return {
    ...defaults,
    generateKey (schema, file, hash, pathFromRoot) {
      const pathParsed = pathFromRoot.split("/");

      if (
        !pathFromRoot.startsWith(defaults.defaultRoot(pathFromRoot)) &&
        !canReferenceSchema(pathParsed) &&
        !canReferenceParameter(pathParsed) &&
        !canReferenceResponse(pathParsed)
      ) {
        return null;
      }

      return defaults.generateKey(schema, file, hash, pathFromRoot);
    },
  };
};

module.exports.getDefaultsForOAS3 = function (defaults = getGenericDefaults(new KeyGenerator(defaultOas3RootResolver))) {
  return {
    ...defaults,
    generateKey (schema, file, hash, pathFromRoot) {
      const pathParsed = pathFromRoot.split("/");

      if (
        !pathFromRoot.startsWith(defaults.defaultRoot(pathFromRoot)) &&
        !canReferenceSchema(pathParsed) &&
        !canReferenceParameter(pathParsed) &&
        !canReferenceResponse(pathParsed) &&
        !canReferenceRequestBody(pathParsed) &&
        !canReferenceHeader(pathParsed)
      ) {
        return null;
      }

      return defaults.generateKey(schema, file, hash, pathFromRoot);
    },
  };
};

function canReferenceSchema (path) {
  return (
    (path.length > 3 && path[1] === "paths" && path.includes("schema")) ||
    (path[1] === "components" && path[2] === "schemas") || // oas2 schema referencing schema
    (path[1] === "definitions")  // oas3 schema referencing schema
  );
}

function canReferenceParameter (path) {
  return (
    // [#, paths, pathName, parameters, 0]
    (path.length === 5 && path[1] === "paths" && path[3] === "parameters") ||
    // [#, paths, pathName, pathMethod, parameters, 0]
    (path.length === 6 && path[1] === "paths" && path[4] === "parameters")
  );
}

function canReferenceResponse (path) {
  // [#, paths, pathName, pathMethod, responses, statusCode]
  return path.length === 6 && path[1] === "paths" && path[4] === "responses";
}

function canReferenceRequestBody (path) {
  // [#, paths, pathName, pathMethod, requestBody]
  return path.length === 5 && path[1] === "paths" && path[4] === "requestBody";
}

function canReferenceHeader (path) {
  // [#, paths, pathName, pathMethod, responses, statusCode, headers, headerName]
  return path.length === 8 && path[1] === "paths" && path[4] === "responses" && path[6] === "headers";
}
