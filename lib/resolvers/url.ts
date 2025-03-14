import { ono } from "@jsdevtools/ono";
import { resolve } from "../util/url.js";
import { ResolverError } from "../util/errors.js";
import type { FileInfo } from "../types/index.js";

export const sendRequest = async ({
  init,
  redirects = [],
  timeout = 60_000,
  url,
}: {
  init?: RequestInit;
  redirects?: string[];
  timeout?: number;
  url: URL | string;
}): Promise<{
  init?: RequestInit;
  response: Response;
}> => {
  url = new URL(url);
  redirects.push(url.href);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  const response = await fetch(url, {
    signal: controller.signal,
    ...init,
  });
  clearTimeout(timeoutId);

  if (response.status >= 300 && response.status <= 399) {
    if (redirects.length > 5) {
      throw new ResolverError(
        ono(
          { status: response.status },
          `Error requesting ${redirects[0]}. \nToo many redirects: \n  ${redirects.join(" \n  ")}`,
        ),
      );
    }

    if (!("location" in response.headers) || !response.headers.location) {
      throw ono({ status: response.status }, `HTTP ${response.status} redirect with no location header`);
    }

    return sendRequest({
      init,
      redirects,
      timeout,
      url: resolve(url.href, response.headers.location as string),
    });
  }

  return { init, response };
}

export const urlResolver = {
  handler: async (file: FileInfo, arrayBuffer?: ArrayBuffer): Promise<void> => {
    let data = arrayBuffer;

    if (!data) {
      try {
        const { init, response } = await sendRequest({
          init: {
            method: 'GET',
          },
          url: file.url,
        });

        if (response.status >= 400) {
          // gracefully handle HEAD method not allowed
          if (response.status !== 405 || init?.method !== 'HEAD') {
            throw ono({ status: response.status }, `HTTP ERROR ${response.status}`);
          }

          data = response.body ? await response.arrayBuffer() : new ArrayBuffer(0)
        }
      } catch (error: any) {
        throw new ResolverError(ono(error, `Error requesting ${file.url}`), file.url);
      }
    }

    file.data = Buffer.from(data!);
  },
};
