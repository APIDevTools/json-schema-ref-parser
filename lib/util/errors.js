"use strict";

const { Ono } = require("@jsdevtools/ono");

const { stripHash, toFileSystemPath } = require("./url");

const JSONParserError = exports.JSONParserError = class JSONParserError extends Error {
  constructor (message, source) {
    super();

    this.code = "EUNKNOWN";
    this.message = message;
    this.source = source;
    this.path = [];

    Ono.extend(this);
  }
};

setErrorName(JSONParserError);

const JSONParserErrorGroup = exports.JSONParserErrorGroup = class JSONParserErrorGroup extends Error {
  constructor (parser) {
    super();

    this.files = parser;
    this.message = `${this.errors.length} error${this.errors.length > 1 ? "s" : ""} occurred while reading '${toFileSystemPath(parser.$refs._root$Ref.path)}'`;

    Ono.extend(this);
  }

  static getParserErrors (parser) {
    const errors = [];

    for (const $ref of Object.values(parser.$refs._$refs)) {
      if ($ref.errors) {
        errors.push(...$ref.errors);
      }
    }

    return errors;
  }

  get errors () {
    return JSONParserErrorGroup.getParserErrors(this.files);
  }
};

setErrorName(JSONParserErrorGroup);

exports.StoplightParserError = class StoplightParserError extends JSONParserError {
  constructor (diagnostics, source) {
    super(`Error parsing ${source}`, source);

    this.code = "ESTOPLIGHTPARSER";

    this._source = source;
    this._path = [];
    this.errors = diagnostics.filter(StoplightParserError.pickError).map(error => {
      let parserError = new ParserError(error.message, source);
      parserError.message = error.message;
      return parserError;
    });
  }

  static pickError (diagnostic) {
    return diagnostic.severity === 0;
  }

  static hasErrors (diagnostics) {
    return diagnostics.some(StoplightParserError.pickError);
  }

  get source () {
    return this._source;
  }

  set source (source) {
    this._source = source;

    if (this.errors) {
      for (let error of this.errors) {
        error.source = source;
      }
    }
  }

  get path () {
    return this._path;
  }

  set path (path) {
    this._path = path;

    if (this.errors) {
      for (let error of this.errors) {
        error.path = path;
      }
    }
  }
};

const ParserError = exports.ParserError = class ParserError extends JSONParserError {
  constructor (message, source) {
    super(`Error parsing ${source}: ${message}`, source);

    this.code = "EPARSER";
  }
};

setErrorName(ParserError);

const UnmatchedParserError = exports.UnmatchedParserError = class UnmatchedParserError extends JSONParserError {
  constructor (source) {
    super(`Could not find parser for "${source}"`, source);

    this.code = "EUNMATCHEDPARSER";
  }
};

setErrorName(UnmatchedParserError);

const ResolverError = exports.ResolverError = class ResolverError extends JSONParserError {
  constructor (ex, source) {
    super(ex.message || `Error reading file "${source}"`, source);

    this.code = "ERESOLVER";

    if ("code" in ex) {
      this.ioErrorCode = String(ex.code);
    }
  }
};

setErrorName(ResolverError);

const UnmatchedResolverError = exports.UnmatchedResolverError = class UnmatchedResolverError extends JSONParserError {
  constructor (source) {
    super(`Could not find resolver for "${source}"`, source);

    this.code = "EUNMATCHEDRESOLVER";
  }
};

setErrorName(UnmatchedResolverError);

const MissingPointerError = exports.MissingPointerError = class MissingPointerError extends JSONParserError {
  constructor (token, path) {
    super(`Token "${token}" does not exist.`, stripHash(path));

    this.code = "EMISSINGPOINTER";
  }
};

setErrorName(MissingPointerError);

const InvalidPointerError = exports.InvalidPointerError = class InvalidPointerError extends JSONParserError {
  constructor (pointer, path) {
    super(`Invalid $ref pointer "${pointer}". Pointers must begin with "#/"`, stripHash(path));

    this.code = "EINVALIDPOINTER";
  }
};

setErrorName(InvalidPointerError);

function setErrorName (err) {
  Object.defineProperty(err.prototype, "name", {
    value: err.name,
    enumerable: true,
  });
}

exports.isHandledError = function (err) {
  return err instanceof JSONParserError || err instanceof JSONParserErrorGroup;
};
