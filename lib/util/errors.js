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

    this.source = source;
    this.errors = errors;
  }
};

exports.StoplightParserError = class StoplightParserError extends GenericErrorGroup {
  constructor (errors, source) {
    super(errors.filter(error => error.severity === 0).map(error => {
      const parsingError = new ParserError(error.message, source);
      parsingError.message = error.message;
      if (error.path) {
        parsingError.path = error.path;
      }

      return parsingError;
    }));

    this.message = `Error parsing ${source}`;
  }
};

const ParserError = exports.ParserError = class ParserError extends GenericError {
  constructor (message, source) {
    super(`Error parsing ${source}: ${message}`, source);
  }
};

setErrorName(ParserError);

const ResolverError = exports.ResolverError = class ResolverError extends GenericError {
  constructor (ex, source) {
    super(ex.message || `Error reading file ${source}`, source);
    if ("code" in ex) {
      this.code = String(ex.code);
    }
  }
};

setErrorName(ResolverError);

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
