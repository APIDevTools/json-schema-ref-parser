"use strict";

const $Ref = require("./ref");
const Pointer = require("./pointer");

module.exports = rereference;

/**
 * Rereference all circular items
 * only has *internal* references, not any *external* references.
 * This method returns a new JSON schema object, adding new references.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 */
function rereference (parser, options) {
  const $refPathMap = {};

  // pre-crawl to detect circularity
  preCrawl(parser.schema, null, "#", options, $refPathMap);

  // definitions creation
  const definitions = parser.schema.definitions || {};
  Object.keys($refPathMap).forEach((pathItem) => {
    const defPath = pathItem.split("#/")[1];
    const defPathList = defPath.split("/");

    // if not an already present definition
    if (defPathList.length !== 2 || defPathList[0] !== "definitions") {
      definitions[defPathList.join("-")] = $refPathMap[pathItem];
    }
  });

  // crawl to replace circularity by definitions
  parser.schema = crawl({
    ...parser.schema,
    definitions
  }, null, "#", options, definitions, Object.values(definitions));

  return parser.schema;
}


/**
 * Recursively crawls the given value, and return circular items.
 *
 * @param {object} parent - The object containing the value to crawl. If the value is not an object or array, it will be ignored.
 * @param {string | null} key - The property key of `parent` to be crawled
 * @param {string} pathFromRoot - The path of the property being crawled, from the schema root
 * @param {$RefParserOptions} options
 * @param {object.<string, *>} $refPathMap
 * @param {object.<string, *>} computedPathMap
 */
function preCrawl (parent, key, pathFromRoot, options, $refPathMap, computedPathMap = {}) {
  let obj = key === null ? parent : parent[key];

  if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj)) {
    const allObj = Object.values(computedPathMap);
    if ($Ref.isAllowed$Ref(obj)) {
      // nothing to do
    }
    else if (allObj.indexOf(obj) !== -1) {
      const refPath = Object.keys(computedPathMap).find((pathKey) => {
        return computedPathMap[pathKey] === obj;
      });
      if (!$refPathMap[refPath]) {
        $refPathMap[refPath] = obj;
      }
    }
    else {
      computedPathMap[pathFromRoot] = obj;

      let keys = Object.keys(obj).sort(sortKeys);

      for (let keyItem of keys) {
        let keyPathFromRoot = Pointer.join(pathFromRoot, keyItem);
        let value = obj[keyItem];

        if (keyItem === "default" || $Ref.isAllowed$Ref(value)) {
          // nothing to do
        }
        else {
          preCrawl(obj, keyItem, keyPathFromRoot, options, $refPathMap, computedPathMap);
        }
      }
    }
  }
}


/**
 * Recursively crawls the given value, and create references fr circular items.
 *
 * @param {object} parent - The object containing the value to crawl. If the value is not an object or array, it will be ignored.
 * @param {string | null} key - The property key of `parent` to be crawled
 * @param {string} pathFromRoot - The path of the property being crawled, from the schema root
 * @param {$RefParserOptions} options
 * @param {object.<string, *>} definitions - pointer to root definitions of the schema
 * @param {*} definitionValues - all the root definitions values
 */
function crawl (parent, key, pathFromRoot, options, definitions, definitionValues) {
  let obj = key === null ? parent : parent[key];

  if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj)) {
    if ($Ref.isAllowed$Ref(obj)) {
      return obj;
    }
    else {
      if (definitionValues.indexOf(obj) !== -1) {
        const defPath = "#/definitions/" + Object.keys(definitions).find((pathKey) => {
          return definitions[pathKey] === obj;
        });

        if (pathFromRoot !== defPath) {
          return {
            $ref: defPath
          };
        }
      }

      // Crawl the object in a specific order that's optimized for bundling.
      // This is important because it determines how `pathFromRoot` gets built,
      // which later determines which keys get dereferenced and which ones get remapped
      // const nextPathMap = { ...pathMap, [path]: obj };
      let keys = Object.keys(obj).sort(sortKeys);

      const newObj = Array.isArray(obj) ? [] : {};
      for (let keyItem of keys) {
        let keyPathFromRoot = Pointer.join(pathFromRoot, keyItem);
        let value = obj[keyItem];

        if (keyItem === "default" || $Ref.isAllowed$Ref(value)) {
          newObj[keyItem] = value;
        }
        else {
          newObj[keyItem] = crawl(obj, keyItem, keyPathFromRoot, options, definitions, definitionValues);
        }
      }

      return newObj;
    }
  }

  return obj;
}


const sortKeys = (a, b) => {
  // Most people will expect references to be bundled into the the "definitions" property,
  // so we always crawl that property first, if it exists.
  if (a === "definitions") {
    return -1;
  }
  else if (b === "definitions") {
    return 1;
  }
  else {
    // Otherwise, crawl the keys based on their length.
    // This produces the shortest possible bundled references
    return a.length - b.length;
  }
};
