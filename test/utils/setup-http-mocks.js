"use strict";

module.exports = typeof window === "object" ? require("./setup-http-mocks-karma") : require("./setup-http-mocks-node");
