/// <reference lib="dom" />
import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import $RefParser from "../../lib/index.js";

const lookupMock = vi.hoisted(() => vi.fn());
const httpsRequestMock = vi.hoisted(() => vi.fn());

vi.mock("node:dns/promises", () => ({
  lookup: lookupMock,
}));

vi.mock("node:https", () => ({
  request: httpsRequestMock,
}));

const isBrowser = typeof window !== "undefined";

type FakeIncomingMessage = Readable & { statusCode: number; headers: Record<string, string>; complete: boolean };

interface PinnedRequestOptions {
  headers: Record<string, string>;
  lookup: (
    hostname: string,
    options: { all: boolean; family: number },
    callback: (
      error: Error | null,
      addresses: string | Array<{ address: string; family: number }>,
      family?: number,
    ) => void,
  ) => void;
  agent: unknown;
  autoSelectFamily: boolean;
  signal?: AbortSignal;
}

function fakeResponse(
  statusCode: number,
  headers: Record<string, string> = {},
  body: Buffer | Readable = Buffer.alloc(0),
): FakeIncomingMessage {
  const stream = body instanceof Readable ? body : Readable.from(body.length > 0 ? [body] : []);
  const res = Object.assign(stream, {
    statusCode,
    headers: Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])),
    complete: false,
  });
  res.on("end", () => {
    res.complete = true;
  });
  return res;
}

function jsonResponse(value: unknown) {
  return fakeResponse(200, { "content-type": "application/json" }, Buffer.from(JSON.stringify(value)));
}

function stalledBody() {
  return new Readable({ read() {} });
}

function mockRequestOnce(res: FakeIncomingMessage) {
  httpsRequestMock.mockImplementationOnce(
    (_url: URL, options: PinnedRequestOptions, callback: (res: FakeIncomingMessage) => void) => {
      const req = Object.assign(new EventEmitter(), {
        end: () => queueMicrotask(() => callback(res)),
      });
      options.signal?.addEventListener("abort", () => res.destroy(new Error("aborted")), { once: true });
      return req;
    },
  );
}

function requestOptions(call: number): PinnedRequestOptions {
  return httpsRequestMock.mock.calls[call]?.[1];
}

describe.skipIf(isBrowser)("HTTP request security", () => {
  beforeEach(() => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    lookupMock.mockReset();
    httpsRequestMock.mockReset();
  });

  it("blocks hostnames that resolve to a private address before fetching", async () => {
    lookupMock.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const parser = new $RefParser();
    await expect(parser.parse("https://public-looking.example/schema.json")).rejects.toThrow(
      "Unsafe URL blocked by safeUrlResolver",
    );

    expect(lookupMock).toHaveBeenCalledWith("public-looking.example", { all: true, verbatim: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(httpsRequestMock).not.toHaveBeenCalled();
  });

  it("validates a redirect target's resolved addresses before fetching it", async () => {
    lookupMock
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "10.0.0.8", family: 4 }]);
    const redirect = fakeResponse(302, { location: "https://rebinding.example/schema.json" }, stalledBody());
    mockRequestOnce(redirect);

    const parser = new $RefParser();
    await expect(parser.parse("https://trusted.example/schema.json")).rejects.toThrow(
      "Unsafe URL blocked by safeUrlResolver",
    );

    expect(lookupMock).toHaveBeenNthCalledWith(2, "rebinding.example", { all: true, verbatim: true });
    expect(httpsRequestMock).toHaveBeenCalledTimes(1);
    expect(redirect.destroyed).toBe(true);
  });

  it("preserves Headers options and strips credentials on cross-origin redirects", async () => {
    const headers = new Headers({
      Authorization: "Bearer top-secret",
      Cookie: "session=top-secret",
      "Proxy-Authorization": "Basic top-secret",
      "X-Request-ID": "safe-to-forward",
    });
    mockRequestOnce(fakeResponse(302, { location: "https://attacker.example/schema.json" }));
    mockRequestOnce(jsonResponse({ type: "string" }));

    const parser = new $RefParser();
    await expect(
      parser.parse("https://trusted.example/schema.json", {
        resolve: { http: { headers } },
      }),
    ).resolves.toEqual({ type: "string" });

    expect(requestOptions(0).headers).toMatchObject({
      authorization: "Bearer top-secret",
      cookie: "session=top-secret",
      "proxy-authorization": "Basic top-secret",
      "x-request-id": "safe-to-forward",
    });
    const redirectedHeaders = requestOptions(1).headers;
    expect(redirectedHeaders).not.toHaveProperty("authorization");
    expect(redirectedHeaders).not.toHaveProperty("proxy-authorization");
    expect(redirectedHeaders).not.toHaveProperty("cookie");
    expect(redirectedHeaders["x-request-id"]).toBe("safe-to-forward");
  });

  it("pins the request lookup to the exact addresses that passed validation", async () => {
    lookupMock.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]);
    mockRequestOnce(jsonResponse({ type: "string" }));

    const parser = new $RefParser();
    await expect(parser.parse("https://trusted.example/schema.json")).resolves.toEqual({ type: "string" });

    const { lookup, agent, autoSelectFamily } = requestOptions(0);
    const lookupAll = (hostname: string) =>
      new Promise<Array<{ address: string; family: number }>>((resolve, reject) => {
        lookup(hostname, { all: true, family: 0 }, (error, addresses) => {
          if (error) {
            reject(error);
          } else if (Array.isArray(addresses)) {
            resolve(addresses);
          } else {
            reject(new Error("Expected the pinned lookup to return all addresses"));
          }
        });
      });

    await expect(lookupAll("trusted.example")).resolves.toEqual([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]);
    await expect(lookupAll("other.example")).rejects.toThrow("No validated address is available for other.example");
    expect(agent).toBe(false);
    expect(autoSelectFamily).toBe(true);
  });

  it("preserves requested encoding and strips connection headers", async () => {
    mockRequestOnce(jsonResponse({ type: "string" }));

    const parser = new $RefParser();
    await parser.parse("https://trusted.example/schema.json", {
      resolve: {
        http: {
          headers: {
            Host: "internal.example",
            "Accept-Encoding": "gzip",
            Connection: "upgrade",
            Upgrade: "websocket",
            "Transfer-Encoding": "chunked",
            "X-Custom": "kept",
          },
        },
      },
    });

    expect(requestOptions(0).headers).toEqual({
      accept: "*/*",
      "accept-encoding": "gzip",
      "user-agent": "node",
      "x-custom": "kept",
    });
  });

  it("decodes compressed responses", async () => {
    const body = gzipSync(Buffer.from(JSON.stringify({ type: "string" })));
    const res = fakeResponse(200, { "content-type": "application/json", "content-encoding": "gzip" }, body);
    mockRequestOnce(res);

    const parser = new $RefParser();
    await expect(parser.parse("https://trusted.example/schema.json")).resolves.toEqual({ type: "string" });

    expect(res.destroyed).toBe(true);
  });

  it("follows redirects regardless of content-encoding", async () => {
    mockRequestOnce(fakeResponse(302, { location: "/target.json", "content-encoding": "br, br, br" }));
    mockRequestOnce(jsonResponse({ type: "string" }));

    const parser = new $RefParser();
    await expect(parser.parse("https://trusted.example/schema.json")).resolves.toEqual({ type: "string" });
  });

  it("rejects an invalid HTTP status", async () => {
    const res = fakeResponse(600, {}, stalledBody());
    mockRequestOnce(res);

    const parser = new $RefParser();
    await expect(parser.parse("https://trusted.example/schema.json")).rejects.toThrow("Invalid HTTP status code: 600");

    expect(res.destroyed).toBe(true);
  });

  it("rejects a content-length above maxContentLength", async () => {
    const res = fakeResponse(200, { "content-length": "11" }, stalledBody());
    mockRequestOnce(res);

    const parser = new $RefParser();
    await expect(
      parser.parse("https://trusted.example/schema.json", { resolve: { http: { maxContentLength: 10 } } }),
    ).rejects.toThrow("Response body exceeds the maxContentLength of 10 bytes");

    expect(res.destroyed).toBe(true);
  });

  it("stops reading a body above maxContentLength", async () => {
    const body = stalledBody();
    const res = fakeResponse(200, {}, body);
    mockRequestOnce(res);

    const parser = new $RefParser();
    const parsing = parser.parse("https://trusted.example/schema.json", {
      resolve: { http: { maxContentLength: 10 } },
    });
    body.push(Buffer.alloc(6));
    body.push(Buffer.alloc(6));

    await expect(parsing).rejects.toThrow("Response body exceeds the maxContentLength of 10 bytes");
    expect(res.destroyed).toBe(true);
  });

  it("rejects a truncated response body", async () => {
    const body = stalledBody();
    mockRequestOnce(fakeResponse(200, { "content-type": "application/json" }, body));

    const parser = new $RefParser();
    const parsing = parser.parse("https://trusted.example/schema.json");
    body.push(Buffer.from('{"type":'));
    setTimeout(() => body.destroy(), 0);

    await expect(parsing).rejects.toThrow("The connection was closed before the response body was complete");
  });

  it("keeps the timeout active for a pinned response body", async () => {
    vi.useFakeTimers();
    const res = fakeResponse(200, { "content-type": "application/json" }, stalledBody());
    mockRequestOnce(res);

    const parser = new $RefParser();
    const rejection = parser
      .parse("https://trusted.example/stalled.json", { resolve: { http: { timeout: 25 } } })
      .catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(26);
    const error = await rejection;

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("Error downloading https://trusted.example/stalled.json");
    expect(requestOptions(0).signal?.aborted).toBe(true);
    expect(res.destroyed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("applies maxContentLength to fetch responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("x".repeat(11)));

    const parser = new $RefParser();
    await expect(
      parser.parse("https://example.com/schema.json", {
        resolve: { http: { safeUrlResolver: false, maxContentLength: 10 } },
      }),
    ).rejects.toThrow("Response body exceeds the maxContentLength of 10 bytes");
  });

  it("keeps the timeout active while consuming the response body", async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | null = null;

    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      requestSignal = init?.signal ?? null;

      return Promise.resolve(
        new Response(
          new ReadableStream({
            start(controller) {
              requestSignal?.addEventListener("abort", () => controller.error(requestSignal?.reason), { once: true });
            },
          }),
          { headers: { "content-type": "application/json" } },
        ),
      );
    });

    const parser = new $RefParser();
    const parsing = parser.parse("https://example.com/stalled.json", {
      resolve: { http: { safeUrlResolver: false, timeout: 25 } },
    });
    const rejection = parsing.catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(26);
    const error = await rejection;

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("Error downloading https://example.com/stalled.json");
    expect(requestSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears the timeout when fetch rejects", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network failed"));

    const parser = new $RefParser();
    await expect(
      parser.parse("https://example.com/schema.json", {
        resolve: { http: { safeUrlResolver: false, timeout: 60_000 } },
      }),
    ).rejects.toThrow("network failed");

    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([302, 404])("cancels an unused HTTP %i response body", async (status) => {
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(body, { status, headers: { location: "/target.json" } }))
      .mockResolvedValueOnce(new Response('{"type":"string"}'));

    const parsing = $RefParser.parse("https://example.com/schema.json", {
      resolve: { http: { safeUrlResolver: false } },
    });

    if (status === 302) {
      await expect(parsing).resolves.toEqual({ type: "string" });
    } else {
      await expect(parsing).rejects.toThrow("HTTP ERROR 404");
    }
    expect(cancel).toHaveBeenCalledOnce();
  });
});
