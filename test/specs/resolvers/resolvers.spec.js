"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");

describe("options.resolve", () => {
  it('should not resolve external links if "resolve.external" is disabled', async () => {
    const schema = await $RefParser
      .dereference(path.abs("specs/resolvers/resolvers.yaml"), { resolve: { external: false }});
    expect(schema).to.deep.equal(parsedSchema);
  });

  it("should throw an error for unrecognized protocols", async () => {
    try {
      await $RefParser.dereference(path.abs("specs/resolvers/resolvers.yaml"));
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      expect(err.message).to.equal('Unable to resolve $ref pointer "foo://bar.baz"');
    }
  });

  it("should use a custom resolver with static values", async () => {
    const schema = await $RefParser
      .dereference(path.abs("specs/resolvers/resolvers.yaml"), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canRead: /^foo\:\/\//i,
            read: { bar: { baz: "hello world" }}
          }
        }
      });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should use a custom resolver that returns a value", async () => {
    const schema = await $RefParser
      .dereference(path.abs("specs/resolvers/resolvers.yaml"), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canRead: /^foo\:\/\//i,
            read (file) {
              return { bar: { baz: "hello world" }};
            }
          }
        }
      });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should use a custom resolver that calls a callback", async () => {
    const schema = await $RefParser
      .dereference(path.abs("specs/resolvers/resolvers.yaml"), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canRead: /^foo\:\/\//i,
            read (file, callback) {
              callback(null, { bar: { baz: "hello world" }});
            }
          }
        }
      });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  if (typeof Promise === "function") {
    it("should use a custom resolver that returns a promise", async () => {
      const schema = await $RefParser
        .dereference(path.abs("specs/resolvers/resolvers.yaml"), {
          resolve: {
            // A custom resolver for "foo://" URLs
            foo: {
              canRead: /^foo\:\/\//i,
              read (file) {
                return Promise.resolve({ bar: { baz: "hello world" }});
              }
            }
          }
        });
      expect(schema).to.deep.equal(dereferencedSchema);
    });
  }

  it("should continue resolving if a custom resolver fails", async () => {
    const schema = await $RefParser
      .dereference(path.abs("specs/resolvers/resolvers.yaml"), {
        resolve: {
          // A custom resolver that always fails
          badResolver: {
            order: 1,
            canRead: true,
            read (file) {
              throw new Error("BOMB!!!");
            }
          },
          // A custom resolver for "foo://" URLs
          foo: {
            canRead: /^foo\:\/\//i,
            read: { bar: { baz: "hello world" }}
          }
        }
      });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

});
