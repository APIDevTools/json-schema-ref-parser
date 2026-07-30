import * as url from "../util/url.js";
import { ResolverError } from "../util/errors.js";
import type { FileInfo, HTTPResolverOptions, JSONSchema } from "../types/index.js";
import type { LookupFunction } from "node:net";
import type { Agent } from "undici";

interface UndiciModule {
  Agent: new (options?: { connect?: { lookup: LookupFunction }; autoSelectFamily?: boolean }) => Agent;
  fetch(input: URL | string, init?: RequestInit & { dispatcher?: Agent }): Promise<unknown>;
}

interface PinnedTransport {
  dispatcher: Agent;
  fetch: UndiciModule["fetch"];
}

export default {
  /**
   * The order that this resolver will run, in relation to other resolvers.
   */
  order: 200,

  /**
   * HTTP headers to send when downloading files.
   *
   * @example:
   * {
   *   "User-Agent": "JSON Schema $Ref Parser",
   *   Accept: "application/json"
   * }
   */
  headers: null,

  /**
   * HTTP request timeout (in milliseconds).
   */
  timeout: 60_000, // 60 seconds

  /**
   * The maximum number of HTTP redirects to follow.
   * To disable automatic following of redirects, set this to zero.
   */
  redirects: 5,

  /**
   * The `withCredentials` option of XMLHttpRequest.
   * Set this to `true` if you're downloading files from a CORS-enabled server that requires authentication
   */
  withCredentials: false,

  /**
   * Set this to `false` if you want to allow unsafe URLs (e.g., `127.0.0.1`, localhost, and other internal URLs).
   */
  safeUrlResolver: true,

  /**
   * Determines whether this resolver can read a given file reference.
   * Resolvers that return true will be tried in order, until one successfully resolves the file.
   * Resolvers that return false will not be given a chance to resolve the file.
   */
  canRead(file: FileInfo) {
    return url.isHttp(file.url) && (!this.safeUrlResolver || !url.isUnsafeUrl(file.url));
  },

  /**
   * Reads the given URL and returns its raw contents as a Buffer.
   */
  read(file: FileInfo) {
    const u = url.parse(file.url);

    if (typeof window !== "undefined" && !u.protocol) {
      // Use the protocol of the current page
      u.protocol = url.parse(location.href).protocol;
    }

    return download(u, this);
  },
} as HTTPResolverOptions<JSONSchema>;

/**
 * Downloads the given file.
 * @returns
 * The promise resolves with the raw downloaded data, or rejects if there is an HTTP error.
 */
async function download<S extends object = JSONSchema>(
  u: URL | string,
  httpOptions: HTTPResolverOptions<S>,
  _redirects?: string[],
): Promise<Buffer> {
  u = url.parse(u);
  const redirects = _redirects || [];
  redirects.push(u.href);
  let pendingResponse: PendingResponse | undefined;

  try {
    let resolvedAddresses: url.ResolvedUrlAddress[] | undefined;
    if (httpOptions.safeUrlResolver) {
      const safety = await url.resolveUrlSafety(u.href);
      if (safety.unsafe) {
        throw new Error(`Unsafe URL blocked by safeUrlResolver: ${u.href}`);
      }
      resolvedAddresses = safety.addresses;
    }

    pendingResponse = await get(u, httpOptions, resolvedAddresses);
    const res = pendingResponse.response;
    if (res.status >= 400) {
      const error = new Error(`HTTP ERROR ${res.status}`) as Error & { status?: number };
      error.status = res.status;
      throw error;
    } else if (res.status >= 300) {
      if (!Number.isNaN(httpOptions.redirects) && redirects.length > httpOptions.redirects!) {
        const error = new Error(
          `Error downloading ${redirects[0]}. \nToo many redirects: \n  ${redirects.join(" \n  ")}`,
        ) as Error & { status?: number };
        error.status = res.status;
        throw new ResolverError(error);
      } else {
        const location = getHeader(res, "location");

        if (!location) {
          const error = new Error(`HTTP ${res.status} redirect with no location header`) as Error & { status?: number };
          error.status = res.status;
          throw error;
        }

        const redirectTo = url.resolve(u.href, location);
        const redirectOptions =
          url.parse(redirectTo).origin === u.origin ? httpOptions : withoutSensitiveHeaders(httpOptions);
        return download(redirectTo, redirectOptions, redirects);
      }
    } else {
      if (res.body) {
        const buf = await res.arrayBuffer();
        return Buffer.from(buf);
      }
      return Buffer.alloc(0);
    }
  } catch (err: unknown) {
    const cause = err instanceof Error ? err : new Error(String(err));
    const wrappedError = new Error(`Error downloading ${u.href}: ${cause.message}`, { cause });

    if ("code" in cause) {
      (wrappedError as Error & { code?: unknown }).code = cause.code;
    }

    throw new ResolverError(wrappedError, u.href);
  } finally {
    pendingResponse?.cancelTimeout();
  }
}

interface PendingResponse {
  response: Response;
  cancelTimeout(): void;
}

/**
 * Sends an HTTP GET request.
 * The promise resolves with the HTTP Response object and a timeout cleanup
 * function. The caller keeps the timeout active until it has consumed the
 * response body.
 */
async function get<S extends object = JSONSchema>(
  u: URL,
  httpOptions: HTTPResolverOptions<S>,
  resolvedAddresses?: readonly url.ResolvedUrlAddress[],
): Promise<PendingResponse> {
  const pinnedTransport =
    resolvedAddresses && resolvedAddresses.length > 0 ? await createPinnedTransport(u, resolvedAddresses) : undefined;
  const dispatcher = pinnedTransport?.dispatcher;
  let controller: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (httpOptions.timeout && typeof AbortController !== "undefined") {
    const abortController = new AbortController();
    controller = abortController;
    timeoutId = setTimeout(() => abortController.abort(), httpOptions.timeout);
  }

  const cancelTimeout = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (dispatcher && !dispatcher.destroyed) {
      void dispatcher.destroy().catch(() => undefined);
    }
  };

  try {
    const requestOptions: RequestInit & { dispatcher?: Agent } = {
      method: "GET",
      headers: httpOptions.headers || {},
      credentials: httpOptions.withCredentials ? "include" : "same-origin",
      redirect: "manual",
      signal: controller ? controller.signal : null,
    };
    if (dispatcher) {
      requestOptions.dispatcher = dispatcher;
    }

    const response = pinnedTransport
      ? ((await pinnedTransport.fetch(u, requestOptions)) as Response)
      : await fetch(u, requestOptions);

    return { response, cancelTimeout };
  } catch (error) {
    cancelTimeout();
    throw error;
  }
}

/**
 * Creates a per-request dispatcher whose DNS callback can only return addresses
 * from the validation lookup. The URL hostname is still used for the Host
 * header and TLS SNI/certificate verification.
 */
async function createPinnedTransport(
  requestUrl: URL,
  resolvedAddresses: readonly url.ResolvedUrlAddress[],
): Promise<PinnedTransport> {
  // Keep the Node-only implementation out of browser module graphs.
  const undiciModuleName = "undici";
  const undici = (await import(undiciModuleName)) as UndiciModule;
  const expectedHostname = normalizeLookupHostname(requestUrl.hostname);
  const pinnedAddresses = resolvedAddresses.map(({ address, family }) => ({ address, family }));

  const lookup: LookupFunction = (hostname, options, callback) => {
    const normalizedHostname = normalizeLookupHostname(hostname);
    const requestedFamily = options.family === "IPv4" ? 4 : options.family === "IPv6" ? 6 : options.family || 0;
    const candidates = pinnedAddresses.filter(({ family }) => requestedFamily === 0 || family === requestedFamily);

    if (normalizedHostname !== expectedHostname || candidates.length === 0) {
      const error = new Error(`No validated address is available for ${hostname}`) as NodeJS.ErrnoException;
      error.code = "ENOTFOUND";
      callback(error, "", 0);
    } else if (options.all) {
      callback(null, candidates);
    } else {
      const selected = candidates[0];
      callback(null, selected.address, selected.family);
    }
  };

  return {
    dispatcher: new undici.Agent({
      connect: { lookup },
      autoSelectFamily: true,
    }),
    fetch: (input, init) => undici.fetch(input, init),
  };
}

function normalizeLookupHostname(hostname: string): string {
  return hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "")
    .toLowerCase();
}

function getHeader(response: Response, name: string): string | null {
  return response.headers.get(name);
}

function withoutSensitiveHeaders<S extends object>(httpOptions: HTTPResolverOptions<S>): HTTPResolverOptions<S> {
  if (!httpOptions.headers) {
    return httpOptions;
  }

  const headers = new Headers(httpOptions.headers);
  headers.delete("authorization");
  headers.delete("proxy-authorization");
  headers.delete("cookie");

  return { ...httpOptions, headers };
}
