"use strict";

const { stripHash } = require("./url");

const GenericError = exports.GenericError = class GenericError extends Error {
  constructor (message, source) {
    super();

    this.message = message;
    this.source = source;
    this.path = [];
  }
};

setErrorName(GenericError);

const GenericErrorGroup = exports.GenericErrorGroup = class GenericErrorGroup extends Error {
  constructor (errors, source) {
    super();

    this._path = undefined;
    this._source = source;
    this.errors = errors;
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

exports.StoplightParserError = class StoplightParserError extends GenericErrorGroup {
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

const ParserError = exports.ParserError = class ParserError extends GenericError {
  constructor (message, source) {
    super(`Error parsing ${source}: ${message}`, source);
  }
};

setErrorName(ParserError);

const UnmatchedParserError = exports.UnmatchedParserError = class UnmatchedParserError extends GenericError {
  constructor (source) {
    super(`Could not find parser for "${source}"`, source);
  }
};

setErrorName(UnmatchedParserError);

const ResolverError = exports.ResolverError = class ResolverError extends GenericError {
  constructor (ex, source) {
    super(ex.message || `Error reading file "${source}"`, source);
    if ("code" in ex) {
      this.code = String(ex.code);
    }
  }
};

setErrorName(ResolverError);

const UnmatchedResolverError = exports.UnmatchedResolverError = class UnmatchedResolverError extends GenericError {
  constructor (source) {
    super(`Could not find resolver for "${source}"`, source);
  }
};

setErrorName(UnmatchedResolverError);

const MissingPointerError = exports.MissingPointerError = class MissingPointerError extends GenericError {
  constructor (token, path) {
    super(`Token "${token}" does not exist.`, stripHash(path));
  }
};

setErrorName(MissingPointerError);

function setErrorName (err) {
  Object.defineProperty(err.prototype, "name", {
    value: err.name,
    enumerable: true,
  });
}

exports.isHandledError = function (err) {
  return err instanceof GenericError || err instanceof GenericErrorGroup;
};
