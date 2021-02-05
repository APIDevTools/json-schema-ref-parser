"use strict";

const { ParserError } = require("../util/errors");
const TextDecoder = require("../util/text-decoder");
const yaml = require("@stoplight/yaml");

const decoder = new TextDecoder();

module.exports = {
  /**
   * The order that this parser will run, in relation to other parsers.
   *
   * @type {number}
   */
  order: 200,

  /**
   * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
   *
   * @type {boolean}
   */
  allowEmpty: true,

  /**
   * Determines whether this parser can parse a given file reference.
   * Parsers that match will be tried, in order, until one successfully parses the file.
   * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
   * every parser will be tried.
   *
   * @type {RegExp|string[]|function}
   */
  canParse: [".yaml", ".yml", ".json"],  // JSON is valid YAML

  /**
   * Parses the given file as YAML
   *
   * @param {object} file           - An object containing information about the referenced file
   * @param {string} file.url       - The full URL of the referenced file
   * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
   * @param {*}      file.data      - The file contents. This will be whatever data type was returned by the resolver
   * @returns {Promise}
   */
  async parse (file) {      // eslint-disable-line require-await
    let data = file.data;
    if (ArrayBuffer.isView(data)) {
      data = decoder.decode(data);
    }

    if (typeof data === "string") {
      try {
        const parsed = yaml.parseWithPointers(data, {
          ignoreDuplicateKeys: true,
          mergeKeys: false,
        });

        if (parsed.diagnostics.some(diagnostic => diagnostic.severity === 0)) {
          const { message, range: { start: { line, character }}} = parsed.diagnostics[0];
          throw new ParserError(`${message} at line ${line + 1}, column ${character + 1}:`, file.url);
        }

        return parsed.data;
      }
      catch (e) {
        throw new ParserError(e.message, file.url);
      }
    }
    else {
      // data is already a JavaScript value (object, array, number, null, NaN, etc.)
      return data;
    }
  }
};
