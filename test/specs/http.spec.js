"use strict";

const { host } = require("@jsdevtools/host-environment");
const { expect, use } = require("chai");
const chai = require("chai");
const spies = require("chai-spies");
const $RefParser = require("../..");

use(spies);

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

      let schema = await parser.parse("https://nghttp2.org/httpbin/headers", {
        resolve: {
          http: {
            headers: {
              accept: "application/json",
            },
          },
        },
      });

      expect(schema.headers).to.have.property("Accept", "application/json");
    });

    // Old versions of IE don't allow setting custom headers
    if (!(host.browser && host.browser.IE)) {
      it("should set custom HTTP headers", async () => {
        let parser = new $RefParser();

        let schema = await parser.parse("https://nghttp2.org/httpbin/headers", {
          resolve: {
            http: {
              headers: {
                "my-custom-header": "hello, world",
              },
            },
          },
        });

        expect(schema.headers).to.have.property(
          "My-Custom-Header",
          "hello, world"
        );
      });
    }
  });

  // 2020-07-08 - The HTTPBin redirect endpoints are suddenly returning 404 errors. Not sure why 🤷‍♂️
  // we have to use https://nghttp2.org/httpbin, see https://github.com/postmanlabs/httpbin/issues/617
  describe("http.redirect", () => {
    if (host.browser.safari && host.karma && host.karma.ci) {
      // These tests fail in Safari when running on Sauce Labs (they pass when running on Safari locally).
      // It gets an XHR error when trying to reach httpbin.org.
      return;
    }

    beforeEach(function () {
      // Increase the timeout for these tests, to allow for multiple redirects
      this.currentTest.timeout(30000);
      this.currentTest.slow(3000);
    });

    it("should follow 5 redirects by default", async () => {
      let parser = new $RefParser();

      let schema = await parser.parse("https://nghttp2.org/httpbin/redirect/5");
      expect(schema.url).to.equal("https://nghttp2.org/httpbin/get");
    });

    it("should not follow 6 redirects by default", async () => {
      try {
        let parser = new $RefParser();
        let schema = await parser.parse(
          "https://nghttp2.org/httpbin/redirect/6"
        );

        if (host.node) {
          throw new Error(
            "All 6 redirects were followed. That should NOT have happened!"
          );
        }
        else {
          // Some web browsers will automatically follow redirects.
          // Nothing we can do about that.
          expect(schema.url).to.equal("https://nghttp2.org/httpbin/get");
        }
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain(
          "Error downloading https://nghttp2.org/httpbin/redirect/6"
        );
        if (host.node) {
          expect(err.message).to.equal(
            "Error downloading https://nghttp2.org/httpbin/redirect/6. \n" +
              "Too many redirects: \n" +
              "  https://nghttp2.org/httpbin/redirect/6 \n" +
              "  https://nghttp2.org/httpbin/relative-redirect/5 \n" +
              "  https://nghttp2.org/httpbin/relative-redirect/4 \n" +
              "  https://nghttp2.org/httpbin/relative-redirect/3 \n" +
              "  https://nghttp2.org/httpbin/relative-redirect/2 \n" +
              "  https://nghttp2.org/httpbin/relative-redirect/1"
          );
        }
      }
    });

    it("should follow 10 redirects if http.redirects = 10", async () => {
      let parser = new $RefParser();

      let schema = await parser.parse(
        "https://nghttp2.org/httpbin/redirect/10",
        {
          resolve: { http: { redirects: 10 }},
        }
      );

      expect(schema.url).to.equal("https://nghttp2.org/httpbin/get");
    });

    it("should not follow any redirects if http.redirects = 0", async () => {
      try {
        let parser = new $RefParser();
        let schema = await parser.parse(
          "https://nghttp2.org/httpbin/redirect/1",
          {
            resolve: { http: { redirects: 0 }},
          }
        );

        if (host.node) {
          throw new Error(
            "The redirect was followed. That should NOT have happened!"
          );
        }
        else {
          // Some web browsers will automatically follow redirects.
          // Nothing we can do about that.
          expect(schema.url).to.equal("https://nghttp2.org/httpbin/get");
        }
      }
      catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain(
          "Error downloading https://nghttp2.org/httpbin/redirect/1"
        );
        if (host.node) {
          expect(err.message).to.equal(
            "Error downloading https://nghttp2.org/httpbin/redirect/1 \n" +
              "uri requested responds with a redirect, redirect mode is set to error: " +
              "https://nghttp2.org/httpbin/redirect/1"
          );
        }
      }
    });
  });

  describe("http.withCredentials", () => {
    if (host.browser.IE && host.karma && host.karma.ci) {
      // These tests often fail in Internet Explorer in CI/CD. Not sure why. They pass when run on IE locally.
      return;
    }

    it('should work by default with CORS "Access-Control-Allow-Origin: *"', async () => {
      let parser = new $RefParser();

      // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
      // This should work by-default.
      let schema = await parser.parse(
        "https://petstore.swagger.io/v2/swagger.json"
      );

      expect(schema).to.be.an("object");
      expect(schema).not.to.be.empty; // eslint-disable-line no-unused-expressions
      expect(parser.schema).to.equal(schema);
    });

    it("should download successfully with http.withCredentials = false (default)", async () => {
      let parser = new $RefParser();

      // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
      // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)
      let schema = await parser.parse(
        "https://petstore.swagger.io/v2/swagger.json",
        {
          resolve: { http: { withCredentials: false }},
        }
      );

      expect(schema).to.be.an("object");
      expect(schema).not.to.be.empty; // eslint-disable-line no-unused-expressions
      expect(parser.schema).to.equal(schema);
    });

    if (host.browser) {
      it("should throw error in browser if http.withCredentials = true", async () => {
        try {
          let parser = new $RefParser();

          // Swagger.io has CORS enabled, with "Access-Control-Allow-Origin" set to a wildcard ("*").
          // So, withCredentials MUST be false (this is the default, but we're testing it explicitly here)
          let schema = await parser.parse(
            "https://petstore.swagger.io/v2/swagger.json",
            {
              resolve: { http: { withCredentials: true }},
            }
          );

          // The request succeeded, which means this browser doesn't support CORS.
          expect(schema).to.be.an("object");
          expect(schema).not.to.be.empty; // eslint-disable-line no-unused-expressions
          expect(parser.schema).to.equal(schema);
        }
        catch (err) {
          // The request failed, which is expected
          expect(err.message).to.contain(
            "Error downloading https://petstore.swagger.io/v2/swagger.json"
          );
        }
      });
    }
  });

  describe("http.basicAuth", () => {
    const sandbox = chai.spy.sandbox();

    beforeEach(() => {
      sandbox.on(host.global, ["fetch", "btoa"]);
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should convert username and password in URL to basic auth", async () => {
      let parser = new $RefParser();

      await parser.parse(
        "https://username:password@petstore.swagger.io/v2/swagger.json"
      );

      expect(host.global.fetch).to.have.been.called.with(
        "https://petstore.swagger.io/v2/swagger.json"
      );

      expect(host.global.btoa).to.have.been.called.with("username:password");
    });
  });
});
