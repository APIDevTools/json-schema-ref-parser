import { describe, it } from "vitest";
import $RefParser from "../../lib/index.js";
import helper from "../utils/helper.js";
import path from "../utils/path.js";
import { ParserError } from "../../lib/util/errors.js";

import { expect } from "vitest";

describe("Callback & Promise syntax", () => {
  const methods = ["parse", "resolve", "dereference", "bundle"] as const;
  for (const method of methods) {
    describe(method + " method", () => {
      it("should call the callback function upon success", testCallbackSuccess(method));
      it("should call the callback function upon failure", testCallbackError(method));
      it("should resolve the Promise upon success", testPromiseSuccess(method));
      it("should reject the Promise upon failure", testPromiseError(method));
    });
  }

  function testCallbackSuccess(method: (typeof methods)[number]) {
    return () =>
      new Promise<void>((resolve, reject) => {
        const parser = new $RefParser();
        parser[method](path.rel("test/specs/internal/internal.yaml"), (err: any, result: any) => {
          try {
            expect(err).to.equal(null);
            expect(result).to.be.an("object");

            if (method === "resolve") {
              expect(result).to.equal(parser.$refs);
            } else {
              expect(result).to.equal(parser.schema);
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
  }

  function testCallbackError(method: (typeof methods)[number]) {
    return () =>
      new Promise<void>((resolve, reject) => {
        // @ts-ignore
        $RefParser[method](path.rel("test/specs/invalid/invalid.yaml"), (err: any, result: any) => {
          try {
            expect(err).to.be.an.instanceOf(ParserError);
            expect(result).to.equal(undefined);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
  }

  function testPromiseSuccess(method: (typeof methods)[number]) {
    return function () {
      const parser = new $RefParser();
      return parser[method](path.rel("test/specs/internal/internal.yaml")).then((result: any) => {
        expect(result).to.be.an("object");

        if (method === "resolve") {
          expect(result).to.equal(parser.$refs);
        } else {
          expect(result).to.equal(parser.schema);
        }
      });
    };
  }

  function testPromiseError(method: (typeof methods)[number]) {
    return async function () {
      try {
        // @ts-ignore
        await $RefParser[method](path.rel("test/specs/invalid/invalid.yaml"));
        helper.shouldNotGetCalled();
      } catch (err: any) {
        expect(err).to.be.an.instanceOf(ParserError);
      }
    };
  }
});
