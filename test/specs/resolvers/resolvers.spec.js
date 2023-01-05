import chai from "chai";
import chaiSubset from "chai-subset";
chai.use(chaiSubset);
const { expect } = chai;
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import { ResolverError, UnmatchedResolverError, JSONParserErrorGroup } from "../../../lib/util/errors.js";

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
          },
          bar: {
            canRead: /^bar\:\/\//i,
            read: { Foo: { Baz: "hello world" }}
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
            read (_file) {
              return { bar: { baz: "hello world" }};
            }
          },
          bar: {
            canRead: /^bar\:\/\//i,
            read (_file) {
              return { Foo: { Baz: "hello world" }};
            }
          }
        }
      });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should return _file url as it's written", async () => {
    const schema = await $RefParser
      .dereference(path.abs("specs/resolvers/resolvers.yaml"), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canRead: /^foo\:\/\//i,
            read (_file) {
              return { bar: { baz: "hello world" }};
            }
          },
          // A custom resolver with uppercase symbols
          bar: {
            canRead: /^bar\:\/\//i,
            read (_file) {
              expect(_file.url).to.be.equal("bar://Foo.Baz");

              return { Foo: { Baz: "hello world" }};
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
            read (_file, callback) {
              callback(null, { bar: { baz: "hello world" }});
            }
          },
          bar: {
            canRead: /^bar\:\/\//i,
            read (_file, callback) {
              callback(null, { Foo: { Baz: "hello world" }});
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
              read (_file) {
                return Promise.resolve({ bar: { baz: "hello world" }});
              }
            },
            bar: {
              canRead: /^bar\:\/\//i,
              read (_file) {
                return Promise.resolve({ Foo: { Baz: "hello world" }});
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
            read (_file) {
              throw new Error("BOMB!!!");
            }
          },
          // A custom resolver for "foo://" URLs
          foo: {
            canRead: /^foo\:\/\//i,
            read: { bar: { baz: "hello world" }}
          },
          bar: {
            canRead: /^bar\:\/\//i,
            read: { Foo: { Baz: "hello world" }}
          }
        }
      });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should normalize errors thrown by resolvers", async () => {
    try {
      await $RefParser.dereference({ $ref: path.abs("specs/resolvers/resolvers.yaml") }, {
        resolve: {
          // A custom resolver that always fails
          file: {
            order: 1,
            canRead: true,
            parse () {
              throw new Error("Woops");
            }
          }
        }
      });
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.instanceof(ResolverError);
      expect(err.message).to.contain("Error opening file");
    }
  });

  it("should throw an error if no resolver returned a result", async () => {
    try {
      await $RefParser.dereference(path.rel("specs/resolvers/resolvers.yaml"), {
        resolve: {
          http: false,
          file: {
            order: 1,
            canRead: true,
            read () {

            }
          }
        }
      });
      helper.shouldNotGetCalled();
    }
    catch (err) {
      // would time out otherwise
      expect(err).to.be.an.instanceOf(ResolverError);
    }
  });

  it("should throw a grouped error if no resolver can be matched and continueOnError is true", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs("specs/resolvers/resolvers.yaml"), {
        resolve: {
          file: false,
          http: false,
        },
        continueOnError: true,
      });
      helper.shouldNotGetCalled();
    }
    catch (err) {
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      expect(err.errors.length).to.equal(1);
      expect(err.errors).to.containSubset([
        {
          name: UnmatchedResolverError.name,
          message: message => message.startsWith("Could not find resolver for"),
          path: [],
          source: message => message.endsWith("specs/resolvers/resolvers.yaml"),
        }
      ]);
    }
  });
});
