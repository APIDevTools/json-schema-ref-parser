import { Ono } from "@jsdevtools/ono";

import url from "./url";

export class JSONParserError extends Error {
  constructor (message, source) {
    super();

    this.code = "EUNKNOWN";
    this.message = message;
    this.source = source;
    this.path = null;

    Ono.extend(this);
  }

  get footprint () {
    return `${this.path}+${this.source}+${this.code}+${this.message}`;
  }
}

setErrorName(JSONParserError);

export class JSONParserErrorGroup extends Error {
  constructor (parser) {
    super();

    this.files = parser;
    this.message = `${this.errors.length} error${this.errors.length > 1 ? "s" : ""} occurred while reading '${url.toFileSystemPath(parser.$refs._root$Ref.path)}'`;

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
}

setErrorName(JSONParserErrorGroup);

export class ParserError extends JSONParserError {
  constructor (message, source) {
    super(`Error parsing ${source}: ${message}`, source);

    this.code = "EPARSER";
  }
}

setErrorName(ParserError);

export class UnmatchedParserError extends JSONParserError {
  constructor (source) {
    super(`Could not find parser for "${source}"`, source);

    this.code = "EUNMATCHEDPARSER";
  }
}

setErrorName(UnmatchedParserError);

export class ResolverError extends JSONParserError {
  constructor (ex, source) {
    super(ex.message || `Error reading file "${source}"`, source);

    this.code = "ERESOLVER";

    if ("code" in ex) {
      this.ioErrorCode = String(ex.code);
    }
  }
}

setErrorName(ResolverError);

export class UnmatchedResolverError extends JSONParserError {
  constructor (source) {
    super(`Could not find resolver for "${source}"`, source);

    this.code = "EUNMATCHEDRESOLVER";
  }
}

setErrorName(UnmatchedResolverError);

export class MissingPointerError extends JSONParserError {
  constructor (token, path) {
    super(`Token "${token}" does not exist.`, url.stripHash(path));

    this.code = "EMISSINGPOINTER";
  }
}

setErrorName(MissingPointerError);

export class InvalidPointerError extends JSONParserError {
  constructor (pointer, path) {
    super(`Invalid $ref pointer "${pointer}". Pointers must begin with "#/"`, url.stripHash(path));

    this.code = "EINVALIDPOINTER";
  }
}

setErrorName(InvalidPointerError);

function setErrorName (err) {
  Object.defineProperty(err.prototype, "name", {
    value: err.name,
    enumerable: true,
  });
}

export function isHandledError (err) {
  return err instanceof JSONParserError || err instanceof JSONParserErrorGroup;
}

export function normalizeError (err) {
  if (err.path === null) {
    err.path = [];
  }

  return err;
}
