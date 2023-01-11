"use strict";

const { host } = require("@jsdevtools/host-environment");

// Load the Babel Polyfills for old browsers.
// NOTE: It's important that we ONLY do this when needed,
// to ensure that our code works _without_ polyfills everywhere else
if (host.browser.IE) {
  require("@babel/polyfill");
}

import("isomorphic-fetch").then(({ default: fetch }) => {
  if (!globalThis.fetch) {
    globalThis.fetch = fetch;
  }
});

if (!globalThis.AbortController) {
  globalThis.AbortController = require("node-abort-controller").AbortController;
}
