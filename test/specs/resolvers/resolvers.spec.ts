import { describe, it } from "vitest";
import { expect } from "vitest";
import type { FileInfo } from "../../../lib/index.js";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import { ResolverError, UnmatchedResolverError, JSONParserErrorGroup } from "../../../lib/util/errors.js";
import type { ParserOptions } from "../../../lib/options";

const selfSignedKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgtssiJGf4HoTmOR7a
gQ0GVH3TzAHKnt246/BGc/CWMAuhRANCAARSXlthTDcst50Xy+gSjJKTqI8ut+gT
U8wFnIbhZRGcoyYuJw0j790OVBo0RsPIkGn67/SbXbR5/KPuD1LSWYPO
-----END PRIVATE KEY-----`;
const selfSignedCert = `-----BEGIN CERTIFICATE-----
MIIBZjCCAQ2gAwIBAgIUR6AsdFtpqVd0/Fo0MlIVV5R9cgYwCgYIKoZIzj0EAwIw
FDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI2MDMwODE4MDk0M1oXDTI3MDMwODE4
MDk0M1owFDESMBAGA1UEAwwJbG9jYWxob3N0MFkwEwYHKoZIzj0CAQYIKoZIzj0D
AQcDQgAEUl5bYUw3LLedF8voEoySk6iPLrfoE1PMBZyG4WURnKMmLicNI+/dDlQa
NEbDyJBp+u/0m120efyj7g9S0lmDzqM9MDswGgYDVR0RBBMwEYIJbG9jYWxob3N0
hwR/AAABMB0GA1UdDgQWBBTXsktzSvAT+42E/wiWneCMNc6UfzAKBggqhkjOPQQD
AgNHADBEAiAjVAMO0sUWXFmrXDDYcm5S9T+hI1fKLaIWhbQgShEj7wIgA157RoMh
mJf0C5aIMmJS5ZMmqUv6QrMeTkhHn+8OQw8=
-----END CERTIFICATE-----`;

async function withSelfSignedHttpsServer(run: (schemaUrl: string) => Promise<void>) {
  const { createServer } = await import(["node", "https"].join(":"));
  const server = createServer({ key: selfSignedKey, cert: selfSignedCert }, (_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ type: "object", properties: { secure: { type: "boolean" } } }));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected the HTTPS test server to listen on a TCP port");
  }

  try {
    await run(`https://127.0.0.1:${address.port}/schema.json`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

describe("options.resolve", () => {
  it('should not resolve external links if "resolve.external" is disabled', async () => {
    const schema = await $RefParser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"), {
      resolve: { external: false },
    });
    expect(schema).to.deep.equal(parsedSchema);
  });

  it("should throw an error for unrecognized protocols", async () => {
    try {
      await $RefParser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"));
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      expect((err as Error).message).to.equal('Unable to resolve $ref pointer "foo://bar.baz"');
    }
  });

  it("should use a custom resolver with static values", async () => {
    const schema = await $RefParser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"), {
      resolve: {
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read: { bar: { baz: "hello world" } },
        },
        bar: {
          canRead: /^bar:\/\//i,
          read: { Foo: { Baz: "hello world" } },
        },
      },
    } as ParserOptions);

    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should use a custom resolver that returns a value", async () => {
    const schema = await $RefParser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"), {
      resolve: {
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read(_file: any) {
            return { bar: { baz: "hello world" } };
          },
        },
        bar: {
          canRead: /^bar:\/\//i,
          read(_file: any) {
            return { Foo: { Baz: "hello world" } };
          },
        },
      },
    });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should allow a custom HTTP resolver to control TLS behavior", async () => {
    if (typeof window !== "undefined") {
      return;
    }

    await withSelfSignedHttpsServer(async (schemaUrl) => {
      const insecureHttpResolver = {
        order: 1,
        canRead: /^https?:\/\//i,
        async read(file: FileInfo) {
          const requestUrl = new URL(file.url);
          const moduleName = requestUrl.protocol === "https:" ? "node:https" : "node:http";
          const { request } = await import(moduleName);

          return await new Promise<Buffer>((resolve, reject) => {
            const req = request(
              requestUrl,
              {
                method: "GET",
                ...(requestUrl.protocol === "https:" ? { rejectUnauthorized: false } : {}),
              },
              (res: any) => {
                const chunks: Buffer[] = [];

                res.on("data", (chunk: string | Buffer) => {
                  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                });
                res.on("end", () => resolve(Buffer.concat(chunks)));
              },
            );

            req.on("error", reject);
            req.end();
          });
        },
      };

      const schema = await $RefParser.dereference(
        {
          $ref: schemaUrl,
        },
        {
          resolve: {
            http: false,
            insecureHttp: insecureHttpResolver,
          },
        } as ParserOptions,
      );

      expect(schema).to.deep.equal({
        type: "object",
        properties: {
          secure: {
            type: "boolean",
          },
        },
      });
    });
  });

  it("should return _file url as it's written", async () => {
    const schema = await $RefParser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"), {
      resolve: {
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read(_file: any) {
            return { bar: { baz: "hello world" } };
          },
        },
        // A custom resolver with uppercase symbols
        bar: {
          canRead: /^bar:\/\//i,
          read(_file: any) {
            expect(_file.url).to.be.equal("bar://Foo.Baz");

            return { Foo: { Baz: "hello world" } };
          },
        },
      },
    });

    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should use a custom resolver that calls a callback", async () => {
    const schema = await $RefParser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"), {
      resolve: {
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read(_file: any, callback: any) {
            callback(null, { bar: { baz: "hello world" } });
          },
        },
        bar: {
          canRead: /^bar:\/\//i,
          read(_file: any, callback: any) {
            callback(null, { Foo: { Baz: "hello world" } });
          },
        },
      },
    });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  if (typeof Promise === "function") {
    it("should use a custom resolver that returns a promise", async () => {
      const schema = await $RefParser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canRead: /^foo:\/\//i,
            read(_file: any) {
              return Promise.resolve({ bar: { baz: "hello world" } });
            },
          },
          bar: {
            canRead: /^bar:\/\//i,
            read(_file: any) {
              return Promise.resolve({ Foo: { Baz: "hello world" } });
            },
          },
        },
      });
      expect(schema).to.deep.equal(dereferencedSchema);
    });
  }

  it("should continue resolving if a custom resolver fails", async () => {
    const schema = await $RefParser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"), {
      resolve: {
        // A custom resolver that always fails
        badResolver: {
          order: 1,
          canRead: true,
          read(_file: any) {
            throw new Error("BOMB!!!");
          },
        },
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read: { bar: { baz: "hello world" } },
        },
        bar: {
          canRead: /^bar:\/\//i,
          read: { Foo: { Baz: "hello world" } },
        },
      },
    });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should normalize errors thrown by resolvers", async () => {
    try {
      await $RefParser.dereference({ $ref: path.abs("test/specs/resolvers/resolvers.yaml") }, {
        resolve: {
          // A custom resolver that always fails
          file: {
            order: 1,
            canRead: true,
            parse() {
              throw new Error("Woops");
            },
          },
        },
      } as ParserOptions);
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.instanceof(ResolverError);
      expect((err as ResolverError).message).to.contain("Error opening file");
    }
  });

  it("should throw an error if no resolver returned a result", async () => {
    try {
      await $RefParser.dereference(path.rel("test/specs/resolvers/resolvers.yaml"), {
        resolve: {
          http: false,
          file: {
            order: 1,
            canRead: true,
            read() {
              return;
            },
          },
        },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      // would time out otherwise
      expect(err).to.be.an.instanceOf(ResolverError);
    }
  });

  it("should throw a grouped error if no resolver can be matched and continueOnError is true", async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs("test/specs/resolvers/resolvers.yaml"), {
        resolve: {
          file: false,
          http: false,
        },
        continueOnError: true,
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.errors.length).to.equal(1);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.errors).to.containSubset([
        {
          name: UnmatchedResolverError.name,
          message: (message: any) => message.startsWith("Could not find resolver for"),
          path: [],
          source: (message: any) => message.endsWith("specs/resolvers/resolvers.yaml"),
        },
      ]);
    }
  });

  it("should preserver capitalization", async () => {
    const parser = new $RefParser();
    let parsed: string | undefined;
    await parser.dereference(
      {
        $ref: "custom://Path/Is/Case/Sensitive",
      },
      {
        resolve: {
          custom: {
            order: 1,
            canRead: /^custom:\/\//i,
            read(file: FileInfo, callback?: (error: Error | null, data: string | null) => any) {
              console.log(file.url);
              parsed = file.url;
              callback?.(null, "custom://Path/Is/Case/Sensitive");
            },
          },
        },
      } as ParserOptions,
    );
    expect(parsed).to.equal("custom://Path/Is/Case/Sensitive");
  });

  it("should block unsafe URLs when safeUrlResolver is true (default)", async () => {
    const unsafeUrls = [
      "http://localhost/schema.json",
      "http://127.0.0.1/schema.json",
      "http://192.168.1.1/schema.json",
      "http://10.0.0.1/schema.json",
      "http://172.16.0.1/schema.json",
    ];

    // if we're in the browser, skip the test
    if (typeof window !== "undefined") {
      return;
    }
    for (const unsafeUrl of unsafeUrls) {
      try {
        await $RefParser.dereference({ $ref: unsafeUrl });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect((err as Error).message).to.contain("Unable to resolve $ref pointer");
      }
    }
  });

  it("should allow unsafe URLs when safeUrlResolver is false", async () => {
    const mockHttpResolver = {
      order: 200,
      canRead: /^https?:\/\//i,
      safeUrlResolver: false,
      read() {
        return { type: "object", properties: { test: { type: "string" } } };
      },
    };

    const schema = await $RefParser.dereference({ $ref: "http://localhost/schema.json" }, {
      resolve: {
        http: mockHttpResolver,
      },
    } as ParserOptions);

    expect(schema).to.deep.equal({
      type: "object",
      properties: { test: { type: "string" } },
    });
  });

  it("should properly resolve a remote schema", async () => {
    const mockHttpResolver = {
      order: 200,
      canRead: true,
      safeUrlResolver: false,
      read() {
        return {
          type: "object",
          properties: {
            firstName: {
              type: "string",
            },
          },
        };
      },
    };

    const schema = await $RefParser.dereference(
      {
        type: "object",
        required: ["firstName"],
        properties: {
          firstName: {
            $ref: "#/$defs/externalModel/properties/firstName",
          },
        },
        $defs: {
          externalModel: {
            $ref: "http://localhost:5000/myModel",
          },
        },
      },
      {
        resolve: {
          http: mockHttpResolver,
        },
      } as ParserOptions,
    );

    expect(schema).to.deep.equal({
      type: "object",
      required: ["firstName"],
      properties: {
        firstName: {
          type: "string",
        },
      },
      $defs: {
        externalModel: {
          type: "object",
          properties: {
            firstName: {
              type: "string",
            },
          },
        },
      },
    });
  });
});
