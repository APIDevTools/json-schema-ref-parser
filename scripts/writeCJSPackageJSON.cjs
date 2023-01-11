const { mkdirSync, writeFileSync } = require("fs");
const { resolve } = require("path");

mkdirSync(resolve(__dirname, "../cjs"), { recursive: true });

const data = JSON.stringify({ type: "commonjs" }, null, "  ")
writeFileSync(resolve(__dirname, "../cjs/package.json"), data, { encoding: "utf-8" });
