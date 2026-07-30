/// <reference lib="dom" />
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import $RefParser from "../../lib/index.js";

const lookupMock = vi.hoisted(() => vi.fn());
const undiciMock = vi.hoisted(() => ({
  fetch: vi.fn(),
  agentOptions: [] as Array<{
    connect?: { lookup?: unknown };
    autoSelectFamily?: boolean;
  }>,
  agents: [] as Array<{ destroyed: boolean }>,
}));

vi.mock("node:dns/promises", () => ({
  lookup: lookupMock,
}));

vi.mock("undici", () => ({
  Agent: class {
    destroyed = false;

    constructor(options: (typeof undiciMock.agentOptions)[number]) {
      undiciMock.agentOptions.push(options);
      undiciMock.agents.push(this);
    }

    async destroy() {
      this.destroyed = true;
    }
  },
  fetch: undiciMock.fetch,
}));

const isBrowser = typeof window !== "undefined";

describe.skipIf(isBrowser)("HTTP request security", () => {
  beforeEach(() => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    lookupMock.mockReset();
    undiciMock.fetch.mockReset();
    undiciMock.agentOptions.length = 0;
    undiciMock.agents.length = 0;
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
    expect(undiciMock.fetch).not.toHaveBeenCalled();
  });

  it("validates a redirect target's resolved addresses before fetching it", async () => {
    lookupMock
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "10.0.0.8", family: 4 }]);
    undiciMock.fetch.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "https://rebinding.example/schema.json" },
      }),
    );

    const parser = new $RefParser();
    await expect(parser.parse("https://trusted.example/schema.json")).rejects.toThrow(
      "Unsafe URL blocked by safeUrlResolver",
    );

    expect(lookupMock).toHaveBeenNthCalledWith(2, "rebinding.example", { all: true, verbatim: true });
    expect(undiciMock.fetch).toHaveBeenCalledTimes(1);
  });

  it("preserves Headers options and strips credentials on cross-origin redirects", async () => {
    const headers = new Headers({
      Authorization: "Bearer top-secret",
      Cookie: "session=top-secret",
      "Proxy-Authorization": "Basic top-secret",
      "X-Request-ID": "safe-to-forward",
    });
    const fetchMock = undiciMock.fetch
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://attacker.example/schema.json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ type: "string" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const parser = new $RefParser();
    await expect(
      parser.parse("https://trusted.example/schema.json", {
        resolve: { http: { headers } },
      }),
    ).resolves.toEqual({ type: "string" });

    const firstRequestHeaders = fetchMock.mock.calls[0]?.[1]?.headers;
    const redirectedHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers);

    expect(firstRequestHeaders).toBe(headers);
    expect(redirectedHeaders.get("authorization")).toBeNull();
    expect(redirectedHeaders.get("proxy-authorization")).toBeNull();
    expect(redirectedHeaders.get("cookie")).toBeNull();
    expect(redirectedHeaders.get("x-request-id")).toBe("safe-to-forward");
    expect(fetchMock.mock.calls[0]?.[1]?.dispatcher).toBe(undiciMock.agents[0]);
    expect(fetchMock.mock.calls[1]?.[1]?.dispatcher).toBe(undiciMock.agents[1]);
    expect(undiciMock.agents.every(({ destroyed }) => destroyed)).toBe(true);
  });

  it("pins the request lookup to the exact addresses that passed validation", async () => {
    lookupMock.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]);
    undiciMock.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ type: "string" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const parser = new $RefParser();
    await expect(parser.parse("https://trusted.example/schema.json")).resolves.toEqual({ type: "string" });

    const lookup = undiciMock.agentOptions[0]?.connect?.lookup as (
      hostname: string,
      options: { all: boolean; family: number },
      callback: (
        error: Error | null,
        addresses: string | Array<{ address: string; family: number }>,
        family?: number,
      ) => void,
    ) => void;
    const pinnedAddresses = await new Promise<Array<{ address: string; family: number }>>((resolve, reject) => {
      lookup("trusted.example", { all: true, family: 0 }, (error, addresses) => {
        if (error) {
          reject(error);
        } else if (Array.isArray(addresses)) {
          resolve(addresses);
        } else {
          reject(new Error("Expected the pinned lookup to return all addresses"));
        }
      });
    });

    expect(pinnedAddresses).toEqual([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]);
    expect(undiciMock.agentOptions[0]?.autoSelectFamily).toBe(true);
  });

  it("keeps the timeout active while consuming the response body", async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | null = null;

    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      requestSignal = init?.signal ?? null;

      return Promise.resolve({
        status: 200,
        body: {},
        headers: new Headers({ "content-type": "application/json" }),
        arrayBuffer: () =>
          new Promise<ArrayBuffer>((_resolve, reject) => {
            requestSignal?.addEventListener("abort", () => reject(requestSignal?.reason), { once: true });
          }),
      } as unknown as Response);
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
});
