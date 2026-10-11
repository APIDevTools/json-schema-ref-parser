import * as url from "../util/url.js";
import { ResolverError } from "../util/errors.js";
import type { FileInfo, HTTPResolverOptions, JSONSchema } from "../types/index.js";
import type { IncomingMessage } from "node:http";
import type { RequestOptions, request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import type * as NodeStream from "node:stream";
import type * as StreamPromises from "node:stream/promises";
import type * as Zlib from "node:zlib";

const DEFAULT_MAX_CONTENT_LENGTH = 50 * 1024 * 1024;
const MAX_CONTENT_ENCODINGS = 5;

const FORBIDDEN_PINNED_REQUEST_HEADERS = [
  "connection",
  "content-length",
  "expect",
  "host",
  "keep-alive",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

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
   * The maximum size of a downloaded file (in bytes), including its decompressed contents.
   */
  maxContentLength: DEFAULT_MAX_CONTENT_LENGTH,

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
        const location = res.getHeader("location");

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
      return await res.readBody(httpOptions.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH);
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
    await pendingResponse?.response.discard();
  }
}

interface HttpResponse {
  status: number;
  getHeader(name: string): string | null;
  readBody(maxContentLength: number): Promise<Buffer>;
  discard(): Promise<void>;
}

interface PendingResponse {
  response: HttpResponse;
  cancelTimeout(): void;
}

/**
 * Sends an HTTP GET request.
 * The promise resolves with the HTTP response and a timeout cleanup
 * function. The caller keeps the timeout active until it has consumed the
 * response body.
 */
async function get<S extends object = JSONSchema>(
  u: URL,
  httpOptions: HTTPResolverOptions<S>,
  resolvedAddresses?: readonly url.ResolvedUrlAddress[],
): Promise<PendingResponse> {
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
  };

  try {
    const response =
      resolvedAddresses && resolvedAddresses.length > 0
        ? await pinnedGet(u, httpOptions, resolvedAddresses, controller?.signal)
        : fromFetchResponse(
            await fetch(u, {
              method: "GET",
              headers: httpOptions.headers || {},
              credentials: httpOptions.withCredentials ? "include" : "same-origin",
              redirect: "manual",
              signal: controller ? controller.signal : null,
            }),
          );

    return { response, cancelTimeout };
  } catch (error) {
    cancelTimeout();
    throw error;
  }
}

function fromFetchResponse(response: Response): HttpResponse {
  return {
    status: response.status,
    getHeader: (name) => response.headers.get(name),
    readBody: (maxContentLength) => readFetchBody(response, maxContentLength),
    async discard() {
      if (response.body && !response.bodyUsed) {
        await response.body.cancel().catch(() => undefined);
      }
    },
  };
}

async function readFetchBody(response: Response, maxContentLength: number): Promise<Buffer> {
  assertContentLengthWithin(response.headers.get("content-length"), maxContentLength);
  if (!response.body) {
    return Buffer.alloc(0);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return Buffer.concat(chunks, received);
    }
    received += value.byteLength;
    if (received > maxContentLength) {
      await reader.cancel().catch(() => undefined);
      throw contentTooLargeError(maxContentLength);
    }
    chunks.push(value);
  }
}

/**
 * Sends the request with Node's own HTTP client, with DNS resolution pinned to
 * the addresses that passed the safety check, so a second lookup (e.g. a DNS
 * rebind) can't send the connection elsewhere. The URL hostname is still used
 * for TLS SNI/certificate verification.
 */
async function pinnedGet<S extends object>(
  u: URL,
  httpOptions: HTTPResolverOptions<S>,
  resolvedAddresses: readonly url.ResolvedUrlAddress[],
  signal: AbortSignal | undefined,
): Promise<HttpResponse> {
  // Keep the Node-only implementation out of browser module graphs.
  const httpModuleName = u.protocol === "https:" ? "node:https" : "node:http";
  const { request } = (await import(httpModuleName)) as { request: typeof httpsRequest };

  const requestOptions: RequestOptions & { autoSelectFamily: boolean } = {
    method: "GET",
    headers: pinnedRequestHeaders(httpOptions.headers),
    lookup: createPinnedLookup(u.hostname, resolvedAddresses),
    agent: false,
    autoSelectFamily: true,
  };
  if (signal) {
    requestOptions.signal = signal;
  }

  const res = await new Promise<IncomingMessage>((resolve, reject) => {
    let receivedResponse = false;
    const req = request(u, requestOptions, (response) => {
      receivedResponse = true;
      resolve(response);
    });
    req.on("error", reject);
    req.on("upgrade", (_response, socket) => {
      socket.destroy();
      reject(new Error("Unexpected HTTP protocol upgrade"));
    });
    req.on("close", () => {
      if (!receivedResponse) {
        reject(new Error("The connection was closed before an HTTP response was received"));
      }
    });
    req.end();
  });
  res.on("error", () => undefined);

  const status = res.statusCode;
  if (status === undefined || status < 200 || status > 599) {
    res.destroy();
    throw new Error(`Invalid HTTP status code: ${status}`);
  }

  return {
    status,
    getHeader(name) {
      const value = res.headers[name.toLowerCase()];
      return Array.isArray(value) ? value.join(", ") : (value ?? null);
    },
    readBody: (maxContentLength) => readIncomingBody(res, maxContentLength, signal),
    async discard() {
      if (!res.destroyed) {
        res.destroy();
      }
    },
  };
}

function pinnedRequestHeaders(headers: HTTPResolverOptions["headers"]): Record<string, string> {
  const merged = new Headers({ accept: "*/*", "accept-encoding": "gzip, deflate, br", "user-agent": "node" });
  new Headers(headers ?? undefined).forEach((value, name) => merged.set(name, value));
  for (const name of FORBIDDEN_PINNED_REQUEST_HEADERS) {
    merged.delete(name);
  }

  const result: Record<string, string> = {};
  merged.forEach((value, name) => {
    result[name] = value;
  });
  return result;
}

async function readIncomingBody(
  res: IncomingMessage,
  maxContentLength: number,
  signal: AbortSignal | undefined,
): Promise<Buffer> {
  assertContentLengthWithin(res.headers["content-length"], maxContentLength);
  const codings = (res.statusCode === 204 || res.statusCode === 205 ? "" : (res.headers["content-encoding"] ?? ""))
    .split(",")
    .map((coding) => coding.trim().toLowerCase())
    .filter((coding) => coding && coding !== "identity");
  if (codings.length > MAX_CONTENT_ENCODINGS) {
    throw new Error(`Too many content-encodings: maximum allowed is ${MAX_CONTENT_ENCODINGS}`);
  }
  for (const coding of codings) {
    if (!["gzip", "x-gzip", "deflate", "x-deflate", "br", "zstd"].includes(coding)) {
      throw new Error(`Unsupported content-encoding: ${coding}`);
    }
  }

  // Variable imports keep Node's stream and decompression modules out of browser graphs.
  const streamModuleName = "node:stream";
  const pipelineModuleName = "node:stream/promises";
  const zlibModuleName = "node:zlib";
  const [{ Duplex, Transform, Writable }, { pipeline }, zlib] = await Promise.all([
    import(streamModuleName) as Promise<typeof NodeStream>,
    import(pipelineModuleName) as Promise<typeof StreamPromises>,
    import(zlibModuleName) as Promise<typeof Zlib>,
  ]);
  const incompleteBodyError = new Error("The connection was closed before the response body was complete");
  if (res.destroyed) {
    throw res.errored ?? incompleteBodyError;
  }

  const limitSize = () => {
    let received = 0;
    return new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        received += chunk.length;
        callback(received > maxContentLength ? contentTooLargeError(maxContentLength) : null, chunk);
      },
    });
  };
  const transforms: NodeStream.Duplex[] = [limitSize()];
  for (const coding of codings.reverse()) {
    const decoder =
      coding === "gzip" || coding === "x-gzip"
        ? zlib.createGunzip()
        : coding === "deflate" || coding === "x-deflate"
          ? createDeflateDecoder(zlib, Duplex)
          : coding === "br"
            ? zlib.createBrotliDecompress()
            : zlib.createZstdDecompress();
    // Bound every decoding stage, including intermediate representations in stacked encodings.
    transforms.push(decoder, limitSize());
  }

  const chunks: Buffer[] = [];
  let received = 0;
  const collector = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk);
      received += chunk.length;
      callback();
    },
  });
  try {
    // Keep the timeout effective even after the network body ends but decoding is still in progress.
    await pipeline([res, ...transforms, collector], signal ? { signal } : {});
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ERR_STREAM_PREMATURE_CLOSE") {
      throw incompleteBodyError;
    }
    throw error;
  }
  return Buffer.concat(chunks, received);
}

/** Some HTTP servers label raw DEFLATE streams as deflate, without the zlib wrapper. */
function createDeflateDecoder(zlib: typeof Zlib, Duplex: typeof NodeStream.Duplex): NodeStream.Duplex {
  let decoder: NodeStream.Transform | undefined;
  return new Duplex({
    read() {
      decoder?.resume();
    },
    write(chunk: Buffer, encoding, callback) {
      if (!decoder) {
        if (chunk.length === 0) {
          callback();
          return;
        }
        decoder = (chunk[0] & 0x0f) === 0x08 ? zlib.createInflate() : zlib.createInflateRaw();
        decoder.on("data", (decoded: Buffer) => {
          if (!this.push(decoded)) {
            decoder?.pause();
          }
        });
        decoder.on("end", () => this.push(null));
        decoder.on("error", (error) => this.destroy(error));
      }
      decoder.write(chunk, encoding, callback);
    },
    final(callback) {
      if (decoder) {
        decoder.end(callback);
      } else {
        this.push(null);
        callback();
      }
    },
    destroy(error, callback) {
      decoder?.destroy();
      callback(error);
    },
  });
}

function assertContentLengthWithin(contentLength: string | null | undefined, maxContentLength: number) {
  if (contentLength && Number(contentLength) > maxContentLength) {
    throw contentTooLargeError(maxContentLength);
  }
}

function contentTooLargeError(maxContentLength: number): Error {
  return new Error(`Response body exceeds the maxContentLength of ${maxContentLength} bytes`);
}

/**
 * Builds a DNS lookup that can only return addresses from the validation
 * lookup, and refuses any other hostname.
 */
function createPinnedLookup(hostname: string, resolvedAddresses: readonly url.ResolvedUrlAddress[]): LookupFunction {
  const expectedHostname = normalizeLookupHostname(hostname);
  const pinnedAddresses = resolvedAddresses.map(({ address, family }) => ({ address, family }));

  return (lookupHostname, options, callback) => {
    const normalizedHostname = normalizeLookupHostname(lookupHostname);
    const requestedFamily = options.family === "IPv4" ? 4 : options.family === "IPv6" ? 6 : options.family || 0;
    const candidates = pinnedAddresses.filter(({ family }) => requestedFamily === 0 || family === requestedFamily);

    if (normalizedHostname !== expectedHostname || candidates.length === 0) {
      const error = new Error(`No validated address is available for ${lookupHostname}`) as NodeJS.ErrnoException;
      error.code = "ENOTFOUND";
      callback(error, "", 0);
    } else if (options.all) {
      callback(null, candidates);
    } else {
      const selected = candidates[0];
      callback(null, selected.address, selected.family);
    }
  };
}

function normalizeLookupHostname(hostname: string): string {
  return hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "")
    .toLowerCase();
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
