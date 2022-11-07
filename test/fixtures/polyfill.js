import { host } from "@jsdevtools/host-environment";

// Load the Babel Polyfills for old browsers.
// NOTE: It's important that we ONLY do this when needed,
// to ensure that our code works _without_ polyfills everywhere else
if (host.browser.IE) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@babel/polyfill");
}

import("node-fetch").then(({ default: fetch }) => {
  if (!globalThis.fetch) {
    globalThis.fetch = fetch;
  }
});

if (!globalThis.AbortController) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  globalThis.AbortController = require("node-abort-controller").AbortController;
}
