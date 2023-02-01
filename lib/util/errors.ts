import { Ono } from "@jsdevtools/ono";
import { stripHash, toFileSystemPath } from "./url.js";
import type $RefParser from "../index.js";

export type JSONParserErrorType =
  | "EUNKNOWN"
  | "EPARSER"
  | "EUNMATCHEDPARSER"
  | "ERESOLVER"
  | "EUNMATCHEDRESOLVER"
  | "EMISSINGPOINTER"
  | "EINVALIDPOINTER";
export class JSONParserError extends Error {
  public readonly name: string;
  public readonly message: string;
  public source: string | undefined;
  public path: Array<string | number> | null;
  public readonly code: JSONParserErrorType;
  public constructor(message: string, source?: string) {
    super();

    this.code = "EUNKNOWN";
    this.name = "JSONParserError";
    this.message = message;
    this.source = source;
    this.path = null;

    Ono.extend(this);
  }

  get footprint() {
    return `${this.path}+${this.source}+${this.code}+${this.message}`;
  }
}

export class JSONParserErrorGroup extends Error {
  files: $RefParser;

  constructor(parser: $RefParser) {
    super();

    this.files = parser;
    this.name = "JSONParserErrorGroup";
    this.message = `${this.errors.length} error${
      this.errors.length > 1 ? "s" : ""
    } occurred while reading '${toFileSystemPath(parser.$refs._root$Ref!.path)}'`;

    Ono.extend(this);
  }

  static getParserErrors(parser: any) {
    const errors = [];

    for (const $ref of Object.values(parser.$refs._$refs)) {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      if ($ref.errors) {
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        errors.push(...$ref.errors);
      }
    }

    return errors;
  }

  get errors(): Array<
    | JSONParserError
    | InvalidPointerError
    | ResolverError
    | ParserError
    | MissingPointerError
    | UnmatchedParserError
    | UnmatchedResolverError
  > {
    return JSONParserErrorGroup.getParserErrors(this.files);
  }
}

export class ParserError extends JSONParserError {
  code = "EPARSER" as JSONParserErrorType;
  name = "ParserError";
  constructor(message: any, source: any) {
    super(`Error parsing ${source}: ${message}`, source);
  }
}

export class UnmatchedParserError extends JSONParserError {
  code = "EUNMATCHEDPARSER" as JSONParserErrorType;
  name = "UnmatchedParserError";

  constructor(source: string) {
    super(`Could not find parser for "${source}"`, source);
  }
}

export class ResolverError extends JSONParserError {
  code = "ERESOLVER" as JSONParserErrorType;
  name = "ResolverError";
  ioErrorCode?: string;
  constructor(ex: Error | any, source?: string) {
    super(ex.message || `Error reading file "${source}"`, source);
    if ("code" in ex) {
      this.ioErrorCode = String(ex.code);
    }
  }
}

export class UnmatchedResolverError extends JSONParserError {
  code = "EUNMATCHEDRESOLVER" as JSONParserErrorType;
  name = "UnmatchedResolverError";
  constructor(source: any) {
    super(`Could not find resolver for "${source}"`, source);
  }
}

export class MissingPointerError extends JSONParserError {
  code = "EUNMATCHEDRESOLVER" as JSONParserErrorType;
  name = "MissingPointerError";
  constructor(token: any, path: any) {
    super(`Token "${token}" does not exist.`, stripHash(path));
  }
}

export class InvalidPointerError extends JSONParserError {
  code = "EUNMATCHEDRESOLVER" as JSONParserErrorType;
  name = "InvalidPointerError";
  constructor(pointer: any, path: any) {
    super(`Invalid $ref pointer "${pointer}". Pointers must begin with "#/"`, stripHash(path));
  }
}

export function isHandledError(err: any): err is JSONParserError {
  return err instanceof JSONParserError || err instanceof JSONParserErrorGroup;
}

export function normalizeError(err: any) {
  if (err.path === null) {
    err.path = [];
  }

  return err;
}
