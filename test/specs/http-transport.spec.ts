/// <reference lib="dom" />
import { createServer, type RequestListener, type Server } from "node:http";
import type { Socket } from "node:net";
import { brotliCompressSync, deflateRawSync, deflateSync, gzipSync, zstdCompressSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import $RefParser from "../../lib/index.js";

vi.mock("../../lib/util/url.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/util/url.js")>()),
  // Approve the local fixture while exercising the actual pinned HTTP transport.
  resolveUrlSafety: async () => ({ unsafe: false, addresses: [{ address: "127.0.0.1", family: 4 }] }),
}));

const isBrowser = typeof window !== "undefined";
const servers = new Set<Server>();
const sockets = new Set<Socket>();

async function serve(handler: RequestListener): Promise<string> {
  const server = createServer(handler);
  servers.add(server);
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected the HTTP fixture to listen on an ephemeral port");
  }
  return `http://transport.example:${address.port}/schema.json`;
}

describe.skipIf(isBrowser)("HTTP transport", () => {
  afterEach(async () => {
    // Upgraded connections are not included in server.closeAllConnections().
    for (const socket of sockets) {
      socket.destroy();
    }
    sockets.clear();
    await Promise.all([...servers].map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
    servers.clear();
  });

  it("reads an uncompressed response through the pinned connection", async () => {
    const schema = { type: "string" };
    const url = await serve((_request, response) => {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(schema));
    });

    await expect($RefParser.parse(url)).resolves.toEqual(schema);
  });

  it("rejects an unsolicited HTTP upgrade even when the connection closes before the timeout", async () => {
    const url = await serve((_request, response) => {
      response.writeHead(101, { upgrade: "websocket", connection: "Upgrade" });
      response.end();
    });

    await expect($RefParser.parse(url, { resolve: { http: { timeout: 50 } } })).rejects.toThrow("Error downloading");
  }, 1_000);

  it.each([
    ["gzip", gzipSync],
    ["x-gzip", gzipSync],
    ["deflate", deflateSync],
    ["x-deflate", deflateSync],
    ["br", brotliCompressSync],
    ["zstd", zstdCompressSync],
  ] as const)("decodes a %s response", async (encoding, compress) => {
    const schema = { type: "string", description: "A compressed schema" };
    const body = compress(Buffer.from(JSON.stringify(schema)));
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": encoding,
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url)).resolves.toEqual(schema);
  });

  it.each(["deflate", "x-deflate"])("decodes raw DEFLATE labeled %s", async (encoding) => {
    const schema = { type: "string", description: "A raw DEFLATE schema" };
    const body = deflateRawSync(Buffer.from(JSON.stringify(schema)));
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": encoding,
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url)).resolves.toEqual(schema);
  });

  it("closes the connection when raw DEFLATE exceeds the decoded size limit", async () => {
    const body = deflateRawSync(Buffer.from(JSON.stringify({ description: "x".repeat(64 * 1024) })));
    const maxContentLength = 1024;
    expect(body.length).toBeLessThan(maxContentLength);
    let onClose: () => void = () => {};
    const closed = new Promise<void>((resolve) => {
      onClose = resolve;
    });
    const url = await serve((_request, response) => {
      response.on("close", onClose);
      response.writeHead(200, { "content-type": "application/json", "content-encoding": "deflate" });
      // Leave the network body open so only the client's size limit closes it.
      response.write(body);
    });

    await expect($RefParser.parse(url, { resolve: { http: { maxContentLength, timeout: 500 } } })).rejects.toThrow(
      "Response body exceeds the maxContentLength of 1024 bytes",
    );
    await closed;
  }, 1_000);

  it("rejects a truncated raw DEFLATE stream", async () => {
    const compressed = deflateRawSync(Buffer.from(JSON.stringify({ type: "string" })));
    const body = compressed.subarray(0, compressed.length - 2);
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": "deflate",
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url)).rejects.toThrow("Error downloading");
  });

  it("streams raw DEFLATE into a subsequent decoder across multiple output chunks", async () => {
    const schema = {
      description: Array.from({ length: 12_000 }, (_, index) =>
        (Math.imul(index + 1, 0x9e3779b1) >>> 0).toString(36),
      ).join(","),
    };
    const intermediate = gzipSync(Buffer.from(JSON.stringify(schema)));
    expect(intermediate.length).toBeGreaterThan(16 * 1024);
    const body = deflateRawSync(intermediate);
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": "gzip, deflate",
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url)).resolves.toEqual(schema);
  });

  it("preserves the caller's Accept-Encoding header", async () => {
    const schema = { type: "string" };
    const body = gzipSync(Buffer.from(JSON.stringify(schema)));
    let acceptEncoding: string | undefined;
    const url = await serve((request, response) => {
      acceptEncoding = request.headers["accept-encoding"];
      response.writeHead(200, { "content-type": "application/json", "content-encoding": "gzip" });
      response.end(body);
    });

    await expect(
      $RefParser.parse(url, { resolve: { http: { headers: { "Accept-Encoding": "gzip" } } } }),
    ).resolves.toEqual(schema);
    expect(acceptEncoding).toBe("gzip");
  });

  it("decodes stacked content encodings in reverse order", async () => {
    const schema = { type: "string" };
    const body = brotliCompressSync(gzipSync(Buffer.from(JSON.stringify(schema))));
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": "gzip, br",
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url)).resolves.toEqual(schema);
  });

  it("rejects more than five content encodings", async () => {
    let body: Buffer = Buffer.from("{}");
    for (let layer = 0; layer < 6; layer++) {
      body = gzipSync(body);
    }
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": Array(6).fill("gzip").join(", "),
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url)).rejects.toThrow("Too many content-encodings");
  });

  it("enforces maxContentLength on decoded bytes even when the compressed body fits", async () => {
    const body = gzipSync(Buffer.from(JSON.stringify({ description: "x".repeat(64 * 1024) })));
    const maxContentLength = 1024;
    expect(body.length).toBeLessThan(maxContentLength);
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": "gzip",
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url, { resolve: { http: { maxContentLength } } })).rejects.toThrow(
      "Response body exceeds the maxContentLength of 1024 bytes",
    );
  });

  it("bounds intermediate decoding even when the wire and final decoded bodies fit", async () => {
    // Gunzip permits trailing zero padding, so the inner decoder yields only {}.
    const intermediate = Buffer.concat([gzipSync(Buffer.from("{}")), Buffer.alloc(100_000)]);
    const body = gzipSync(intermediate);
    const maxContentLength = 1024;
    expect(body.length).toBeLessThan(maxContentLength);
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": "gzip, gzip",
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url, { resolve: { http: { maxContentLength } } })).rejects.toThrow(
      "Response body exceeds the maxContentLength of 1024 bytes",
    );
  });

  it("rejects a missing gzip trailer even when the decoded JSON is complete", async () => {
    const compressed = gzipSync(Buffer.from(JSON.stringify({ type: "string" })));
    const body = compressed.subarray(0, compressed.length - 8);
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": "gzip",
        "content-length": body.length,
      });
      response.end(body);
    });

    await expect($RefParser.parse(url)).rejects.toThrow("Error downloading");
  });

  it("times out while consuming a stalled compressed response", async () => {
    const body = gzipSync(Buffer.from(JSON.stringify({ type: "string" })));
    const url = await serve((_request, response) => {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-encoding": "gzip",
        "content-length": body.length,
      });
      response.write(body.subarray(0, 10));
    });

    await expect($RefParser.parse(url, { resolve: { http: { timeout: 50 } } })).rejects.toThrow("Error downloading");
  }, 1_000);
});
