"use strict";

const { default: pkg } = require("fetch-mock");

let fetchMock;
let fetchDesc;

beforeEach(() => {
  fetchMock = pkg.sandbox();
  fetchMock.config.fetch = fetch;
  fetchMock.config.fallbackToNetwork = true;
  fetchMock.config.warnOnFallback = false;
  fetchDesc = Object.getOwnPropertyDescriptor(window, "fetch");
  window.fetch = fetchMock;
});

afterEach(() => {
  fetchMock.restore();
  Object.defineProperty(window, "fetch", fetchDesc);
});

module.exports = function (mocks) {
  fetchMock.config.warnOnFallback = true;
  for (const [url, body] of Object.entries(mocks)) {
    for (const actualUrl of new Set([url.replace(/([^\/])\?/, "$1/?"), url.replace(/([^\/])\?/, "$1?")])) {
      fetchMock.mock(actualUrl, {
        status: 200,
        body,
      });
    }
  }
};
