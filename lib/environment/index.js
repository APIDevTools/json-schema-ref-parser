"use strict";

exports.env = {
  platform: "unknown",
  environment: "unknown",
  getEnvironment () {
    return this.environment;
  },
  setEnvironment (newEnvironment) {
    this.environment = newEnvironment;
  },
  getCwd () {
    return "/";
  },
  isBrowser () {
    return this.environment === "browser";
  },
  TextDecoder: globalThis.TextDecoder || class {
    constructor () {
      throw new Error("TextDecoder not available");
    }
  }
};
