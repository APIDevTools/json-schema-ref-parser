/// <reference lib="dom" />
import { describe, it, beforeEach } from "vitest";
import $RefParser from "../../lib/index.js";

import { expect } from "vitest";

const isWindows = /^win/.test(globalThis.process ? globalThis.process.platform : "");
const isBrowser = typeof window !== "undefined";
describe("HTTP options", () => {
  describe.skip("http.headers", () => {
    it("should override default HTTP headers", async () => {
      if (isWindows || isBrowser) {
        return;
      }

      const parser = new $RefParser();

      const schema = await parser.parse("https://httpbin.org/headers", {
        resolve: {
          http: {
            headers: {
              accept: "application/json",
            },
          },
        },
      });

      // @ts-expect-error TS(2339): Property 'headers' does not exist on type 'void & ... Remove this comment to see the full error message
      expect(schema.headers).to.have.property("Accept", "application/json");
    });

    // Old versions of IE don't allow setting custom headers
    it("should set custom HTTP headers", async () => {
      if (isWindows) {
        return;
      }

      const parser = new $RefParser();

      const schema = await parser.parse("https://httpbin.org/headers", {
        resolve: {
          http: {
            headers: {
              "my-custom-header": "hello, world",
            },
          },
        },
      });

      // @ts-expect-error TS(2339): Property 'headers' does not exist on type 'void & ... Remove this comment to see the full error message
      expect(schema.headers).to.have.property("My-Custom-Header", "hello, world");
    });
  });

  // 2020-07-08 - The HTTPBin redirect endpoints are suddenly returning 404 errors. Not sure why 🤷‍♂️
  // TODO: Re-enable these tests once HTTPBin is working again
  describe.skip("http.redirect", () => {
    beforeEach(function (this: any) {
      // Increase the timeout for these tests, to allow for multiple redirects
      this.currentTest.timeout(30000);
      this.currentTest.slow(3000);
    });

    it("should follow 5 redirects by default", async () => {
      const parser = new $RefParser();

      const schema = await parser.parse("https://httpbin.org/redirect/5");
      // @ts-expect-error TS(2339): Property 'url' does not exist on type 'JSONSchema'... Remove this comment to see the full error message
      expect(schema.url).to.equal("https://httpbin.org/get");
    });

    it("should not follow 6 redirects by default", async () => {
      try {
        const parser = new $RefParser();
        const schema = await parser.parse("https://httpbin.org/redirect/6");

        if (typeof window === "undefined") {
          throw new Error("All 6 redirects were followed. That should NOT have happened!");
        } else {
          // Some web browsers will automatically follow redirects.
          // Nothing we can do about that.
          // @ts-expect-error TS(2339): Property 'url' does not exist on type 'JSONSchema'... Remove this comment to see the full error message
          expect(schema.url).to.equal("https://httpbin.org/get");
        }
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error downloading https://httpbin.org/redirect/6");
        if (typeof window === "undefined") {
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.message).to.equal(
            "Error downloading https://httpbin.org/redirect/6. \n" +
              "Too many redirects: \n" +
              "  https://httpbin.org/redirect/6 \n" +
              "  https://httpbin.org/relative-redirect/5 \n" +
              "  https://httpbin.org/relative-redirect/4 \n" +
              "  https://httpbin.org/relative-redirect/3 \n" +
              "  https://httpbin.org/relative-redirect/2 \n" +
              "  https://httpbin.org/relative-redirect/1",
          );
        }
      }
    });

    it("should follow 10 redirects if http.redirects = 10", async () => {
      const parser = new $RefParser();

      const schema = await parser.parse("https://httpbin.org/redirect/10", {
        resolve: { http: { redirects: 10 } },
      });

      // @ts-expect-error TS(2339): Property 'url' does not exist on type 'void & Prom... Remove this comment to see the full error message
      expect(schema.url).to.equal("https://httpbin.org/get");
    });

    it("should not follow any redirects if http.redirects = 0", async () => {
      try {
        const parser = new $RefParser();

        const schema = await parser.parse("https://httpbin.org/redirect/1", {
          resolve: { http: { redirects: 0 } },
        });

        if (typeof window === "undefined") {
          throw new Error("The redirect was followed. That should NOT have happened!");
        } else {
          // Some web browsers will automatically follow redirects.
          // Nothing we can do about that.
          // @ts-expect-error TS(2339): Property 'url' does not exist on type 'void & Prom... Remove this comment to see the full error message
          expect(schema.url).to.equal("https://httpbin.org/get");
        }
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Error downloading https://httpbin.org/redirect/1");
        if (typeof window === "undefined") {
          // @ts-expect-error TS(2571): Object is of type 'unknown'.
          expect(err.message).to.equal(
            "Error downloading https://httpbin.org/redirect/1. \n" +
              "Too many redirects: \n" +
              "  https://httpbin.org/redirect/1",
          );
        }
      }
    });
  });

  if (!isWindows) {
    describe("http.withCredentials", () => {
      it('should work by default with CORS "Access-Control-Allow-Origin: *"', async () => {
        const parser = new $RefParser();

        // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
        // This should work by-default.
        const schema = await parser.parse("https://petstore.swagger.io/v2/swagger.json");

        expect(schema).to.be.an("object");
        expect(parser.schema).to.equal(schema);
      });

      it("should download successfully with http.withCredentials = false (default)", async () => {
        const parser = new $RefParser();

        // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
        // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)

        const schema = await parser.parse("https://petstore.swagger.io/v2/swagger.json", {
          resolve: { http: { withCredentials: false } },
        });

        expect(schema).to.be.an("object");
        expect(parser.schema).to.equal(schema);
      });

      if (isBrowser) {
        it("should throw error in browser if http.withCredentials = true", async () => {
          try {
            const parser = new $RefParser();

            // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
            // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)

            const schema = await parser.parse("https://petstore.swagger.io/v2/swagger.json", {
              resolve: { http: { withCredentials: true } },
            });

            // The request succeeded, which means this browser doesn't support CORS.
            expect(schema).to.be.an("object");
            expect(parser.schema).to.equal(schema);
          } catch (err) {
            // The request failed, which is expected
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            expect(err.message).to.contain("Error downloading https://petstore.swagger.io/v2/swagger.json");
          }
        });
      }
    });
  }
});
