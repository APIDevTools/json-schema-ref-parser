"use strict";

const { createServer } = require("http");

const { host } = require("host-environment");
const { expect } = require("chai");
const $RefParser = require("../../lib");

describe("HTTP options", () => {
  let windowOnError, testDone;

  beforeEach(() => {
    // Some browsers throw global errors on XHR errors
    windowOnError = host.global.onerror;
    host.global.onerror = function () {
      testDone();
      return true;
    };
  });

  afterEach(() => {
    host.global.onerror = windowOnError;
  });

  describe("http.headers", () => {
    it("should override default HTTP headers", async () => {
      let parser = new $RefParser();

      let schema = await parser.parse("https://httpbin.org/headers", {
        resolve: { http: { headers: {
          accept: "application/json"
        }}}
      });

      expect(schema.headers).to.have.property("Accept", "application/json");
    });

    // Old versions of IE don't allow setting custom headers
    if (!(host.browser && host.browser.IE)) {
      it("should set custom HTTP headers", async () => {
        let parser = new $RefParser();

        let schema = await parser.parse("https://httpbin.org/headers", {
          resolve: { http: { headers: {
            "my-custom-header": "hello, world"
          }}}
        });

        expect(schema.headers).to.have.property("My-Custom-Header", "hello, world");
      });
    }
  });

  describe("http.redirect", () => {
    if (host.karma && host.env.CI) {
      // These tests fail in Safari when running on Sauce Labs (they pass when running on Safari locally).
      // It gets an XHR error when trying to reach httpbin.org.
      // TODO: Only skip these tests on Safari on Sauce Labs
      return;
    }

    beforeEach(function () {
      // Increase the timeout for these tests, to allow for multiple redirects
      this.currentTest.timeout(30000);
      this.currentTest.slow(3000);
    });

    it("should follow 5 redirects by default", async () => {
      let parser = new $RefParser();

      let schema = await parser.parse("https://httpbin.org/redirect/5");
      expect(schema.url).to.equal("https://httpbin.org/get");
    });

    it("should not follow 6 redirects by default", async () => {
      try {
        let parser = new $RefParser();
        let schema = await parser.parse("https://httpbin.org/redirect/6");

        if (host.node) {
          throw new Error("All 6 redirects were followed. That should NOT have happened!");
        }
        else {
          // Some web browsers will automatically follow redirects.
          // Nothing we can do about that.
          expect(schema.url).to.equal("https://httpbin.org/get");
        }
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain("Error downloading https://httpbin.org/redirect/6");
        if (host.node) {
          expect(err.message).to.equal(
            "Error downloading https://httpbin.org/redirect/6. \n" +
            "Too many redirects: \n" +
            "  https://httpbin.org/redirect/6 \n" +
            "  https://httpbin.org/relative-redirect/5 \n" +
            "  https://httpbin.org/relative-redirect/4 \n" +
            "  https://httpbin.org/relative-redirect/3 \n" +
            "  https://httpbin.org/relative-redirect/2 \n" +
            "  https://httpbin.org/relative-redirect/1"
          );
        }
      }
    });

    it("should follow 10 redirects if http.redirects = 10", async () => {
      let parser = new $RefParser();

      let schema = await parser.parse("https://httpbin.org/redirect/10", {
        resolve: { http: { redirects: 10 }}
      });

      expect(schema.url).to.equal("https://httpbin.org/get");
    });

    it("should not follow any redirects if http.redirects = 0", async () => {
      try {
        let parser = new $RefParser();
        let schema = await parser.parse("https://httpbin.org/redirect/1", {
          resolve: { http: { redirects: 0 }}
        });

        if (host.node) {
          throw new Error("The redirect was followed. That should NOT have happened!");
        }
        else {
        // Some web browsers will automatically follow redirects.
        // Nothing we can do about that.
          expect(schema.url).to.equal("https://httpbin.org/get");
        }
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain("Error downloading https://httpbin.org/redirect/1");
        if (host.node) {
          expect(err.message).to.equal(
            "Error downloading https://httpbin.org/redirect/1. \n" +
          "Too many redirects: \n" +
          "  https://httpbin.org/redirect/1"
          );
        }
      }
    });
  });

  describe("http.withCredentials", () => {
    it('should work by default with CORS "Access-Control-Allow-Origin: *"', async () => {
      let parser = new $RefParser();

      // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
      // This should work by-default.
      let schema = await parser.parse("https://petstore.swagger.io/v2/swagger.json");

      expect(schema).to.be.an("object");
      expect(schema).not.to.be.empty;
      expect(parser.schema).to.equal(schema);
    });

    it("should download successfully with http.withCredentials = false (default)", async () => {
      let parser = new $RefParser();

      // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
      // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)
      let schema = await parser.parse("https://petstore.swagger.io/v2/swagger.json", {
        resolve: { http: { withCredentials: false }}
      });

      expect(schema).to.be.an("object");
      expect(schema).not.to.be.empty;
      expect(parser.schema).to.equal(schema);
    });

    if (host.browser) {
      it("should throw error in browser if http.withCredentials = true", async () => {
        try {
          let parser = new $RefParser();

          // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
          // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)
          let schema = await parser.parse("https://petstore.swagger.io/v2/swagger.json", {
            resolve: { http: { withCredentials: true }}
          });

          // The request succeeded, which means this browser doesn't support CORS.
          expect(schema).to.be.an("object");
          expect(schema).not.to.be.empty;
          expect(parser.schema).to.equal(schema);
        }
        catch (err) {
          // The request failed, which is expected
          expect(err.message).to.contain("Error downloading https://petstore.swagger.io/v2/swagger.json");
        }
      });
    }
  });

  describe("http.retries", () => {
    // The test starts its own server which we cannot do in browsers
    // The option is unrelated to the request transport though so it's
    // safe to test in Node only.
    if (host.node) {
      it("should retry http requests by default", (done) => {
        let count = 0;
        const server = createServer((request, response) => {
          // fail first request with 500, make 2nd request succeed
          if (count++) {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.write('{"ok": true}');
            return response.end();
          }

          response.writeHead(500);
          response.write("Oops");
          response.end();
        });

        server.listen(0, async () => {
          const url = "http://localhost:" + server.address().port;
          try {
            const parser = new $RefParser();

            let schema = await parser.parse(url);
            expect.fail("Should not resolve");
          }
          catch (err) {
            expect(err.message).to.contain(`Error downloading ${url}`);
          }

          server.close(done);
        });
      });

      it("should retry http requests", (done) => {
        let count = 0;
        const server = createServer((request, response) => {
          // fail first request with 500, make 2nd request succeed
          if (count++) {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.write('{"ok": true}');
            return response.end();
          }

          response.writeHead(500);
          response.write("Oops");
          response.end();
        });

        server.listen(0, async () => {
          const parser = new $RefParser();
          const url = "http://localhost:" + server.address().port;

          let schema = await parser.parse(url, { resolve: { http: { retries: 1 }}});
          server.close(done);
          expect(schema).to.deep.equal({ ok: true });
        });
      });

      it("should not retry more often than configured", (done) => {
        let count = 0;
        const server = createServer((request, response) => {
          // fail first two request with 500, make 3rd request succeed
          if (count++ > 1) {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.write('{"ok": true}');
            return response.end();
          }

          response.writeHead(500);
          response.write("Oops");
          response.end();
        });

        server.listen(0, async () => {
          const url = "http://localhost:" + server.address().port;
          try {
            const parser = new $RefParser();

            await parser.parse(url, { resolve: { http: { retries: 1 }}});
            expect.fail("Should not resolve");
          }
          catch (err) {
            expect(err.message).to.contain(`Error downloading ${url}`);
          }

          server.close(done);
        });
      });
    }
  });
});
