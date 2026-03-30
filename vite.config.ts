// @ts-check

import { defineConfig } from "vitest/config";

const isBrowser = process.env.BROWSER === "true";
const browserBaseUrl = process.env.TEST_HTTP_BASE_URL || "http://localhost:3000/";
export default defineConfig({
  test: {
    environment: isBrowser ? "jsdom" : "node",
    environmentOptions: isBrowser ? { jsdom: { url: browserBaseUrl } } : undefined,
    dir: "test",
    exclude: ["**/__IGNORED__/**"],
    watch: false,
    globalSetup: isBrowser ? ["./test/fixtures/server.ts"] : [],
    testTimeout: 5000,
    globals: true,
    passWithNoTests: true,
    reporters: ["verbose"],
    coverage: { reporter: ["lcov", "html", "text"] },
    snapshotSerializers: ["./test/utils/serializeJson.ts"],
  },
});
