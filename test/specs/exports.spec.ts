import { describe, it } from "vitest";
import defaultExport from "../../lib/index.js";
import { default as namedDefaultExport } from "../../lib/index.js";
import {
  JSONParserError,
  InvalidPointerError,
  MissingPointerError,
  ResolverError,
  ParserError,
  UnmatchedParserError,
  UnmatchedResolverError,
} from "../../lib/index.js";

import { expect } from "vitest";

describe("json-schema-ref-parser package exports", () => {
  function is$RefParser(parser: any) {
    expect(parser).to.be.a("function").with.property("name", "$RefParser");
    expect(parser.parse).to.be.a("function").with.property("name", "parse");
    expect(parser.prototype.parse).to.be.a("function").with.property("name", "parse");
    expect(parser.resolve).to.be.a("function").with.property("name", "resolve");
    expect(parser.prototype.resolve).to.be.a("function").with.property("name", "resolve");
    expect(parser.dereference).to.be.a("function").with.property("name", "dereference");
    expect(parser.prototype.dereference).to.be.a("function").with.property("name", "dereference");
    expect(parser.bundle).to.be.a("function").with.property("name", "bundle");
    expect(parser.prototype.bundle).to.be.a("function").with.property("name", "bundle");
    return true;
  }

  // it("should export the $RefParser class as the default CommonJS export", async () => {
  //   expect(commonJSExport).to.satisfy(is$RefParser);
  // });

  it("should export the $RefParser class as the default ESM export", async () => {
    expect(defaultExport).to.satisfy(is$RefParser);
  });

  it("should export the $RefParser class as the named default ESM export", async () => {
    expect(namedDefaultExport).to.satisfy(is$RefParser);
  });

  it("should export the JSONParserError class as a named ESM export", async () => {
    expect(JSONParserError).to.be.a("function");
    expect(JSONParserError.name).to.equal("JSONParserError");
  });

  it("should export the InvalidPointerError class as a named ESM export", async () => {
    expect(InvalidPointerError).to.be.a("function");
    expect(InvalidPointerError.name).to.equal("InvalidPointerError");
  });

  it("should export the MissingPointerError class as a named ESM export", async () => {
    expect(MissingPointerError).to.be.a("function");
    expect(MissingPointerError.name).to.equal("MissingPointerError");
  });

  it("should export the ResolverError class as a named ESM export", async () => {
    expect(ResolverError).to.be.a("function");
    expect(ResolverError.name).to.equal("ResolverError");
  });

  it("should export the ParserError class as a named ESM export", async () => {
    expect(ParserError).to.be.a("function");
    expect(ParserError.name).to.equal("ParserError");
  });

  it("should export the UnmatchedParserError class as a named ESM export", async () => {
    expect(UnmatchedParserError).to.be.a("function");
    expect(UnmatchedParserError.name).to.equal("UnmatchedParserError");
  });

  it("should export the UnmatchedResolverError class as a named ESM export", async () => {
    expect(UnmatchedResolverError).to.be.a("function");
    expect(UnmatchedResolverError.name).to.equal("UnmatchedResolverError");
  });
});
