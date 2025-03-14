import { defineConfig } from "vitest/config";

const isBrowser = process.env.BROWSER === "true";
export default defineConfig({
  test: {
    coverage: { reporter: ["lcov", "html", "text"] },
    dir: "test",
    environment: isBrowser ? "jsdom" : "node",
    exclude: ["**/__IGNORED__/**"],
    globals: true,
    globalSetup: isBrowser ? ["./test/fixtures/server.ts"] : undefined,
    include: ['./lib/**/*.test.ts'],
    passWithNoTests: true,
    reporters: ["verbose"],
    testTimeout: 5000,
    watch: false,
  },
});
