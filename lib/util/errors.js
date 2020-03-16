"use strict";

const { Ono } = require("@jsdevtools/ono");

const { stripHash } = require("./url");

const JSONParserError = exports.JSONParserError = class JSONParserError extends Error {
  constructor (message, source) {
    super();

    this.message = message;
    this.source = source;
    this.path = [];

    Ono.extend(this);
  }
};

setErrorName(JSONParserError);

const JSONParserErrorGroup = exports.JSONParserErrorGroup = class JSONParserErrorGroup extends Error {
  constructor (errors, source) {
    super();

    this._path = undefined;
    this._source = source;
    this.errors = errors;

    Ono.extend(this);
  }

  get source () {
    return this._source;
  }

  set source (source) {
    this._source = source;

    for (let error of this.errors) {
      error.source = source;
    }
  }

  get path () {
    return this.path;
  }

  set path (path) {
    this._path = path;

    for (let error of this.errors) {
      error.path = path;
    }
  }
};

exports.StoplightParserError = class StoplightParserError extends JSONParserErrorGroup {
  constructor (diagnostics, source) {
    super(diagnostics.filter(StoplightParserError.pickError).map(error => {
      let parserError = new ParserError(error.message, source);
      parserError.message = error.message;
      return parserError;
    }));

    this.message = `Error parsing ${source}`;
  }

  static pickError (diagnostic) {
    return diagnostic.severity === 0;
  }

  static hasErrors (diagnostics) {
    return diagnostics.some(StoplightParserError.pickError);
  }
};

const ParserError = exports.ParserError = class ParserError extends JSONParserError {
  constructor (message, source) {
    super(`Error parsing ${source}: ${message}`, source);
  }
};

setErrorName(ParserError);

const UnmatchedParserError = exports.UnmatchedParserError = class UnmatchedParserError extends JSONParserError {
  constructor (source) {
    super(`Could not find parser for "${source}"`, source);
  }
};

setErrorName(UnmatchedParserError);

const ResolverError = exports.ResolverError = class ResolverError extends JSONParserError {
  constructor (ex, source) {
    super(ex.message || `Error reading file "${source}"`, source);
    if ("code" in ex) {
      this.code = String(ex.code);
    }
  }
};

setErrorName(ResolverError);

const UnmatchedResolverError = exports.UnmatchedResolverError = class UnmatchedResolverError extends JSONParserError {
  constructor (source) {
    super(`Could not find resolver for "${source}"`, source);
  }
};

setErrorName(UnmatchedResolverError);

const MissingPointerError = exports.MissingPointerError = class MissingPointerError extends JSONParserError {
  constructor (token, path) {
    super(`Token "${token}" does not exist.`, stripHash(path));
  }
};

setErrorName(MissingPointerError);

const InvalidPointerError = exports.InvalidPointerError = class InvalidPointerError extends JSONParserError {
  constructor (pointer, path) {
    super(`Invalid $ref pointer "${pointer}". Pointers must begin with "#/"`, stripHash(path));
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
