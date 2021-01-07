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
    fetchMock.mock(url.replace(/([^\/])\?/, "$1/?"), {
      status: 200,
      body,
    });
  }
};
