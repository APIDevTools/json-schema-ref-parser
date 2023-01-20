const nodePath = require("path");

// Webpack 4 (used by browser tests) can't transpile import.meta.url
// So export the project directory using __dirname from a .cjs module
const projectDir = nodePath.resolve(__dirname, "..", "..");
module.exports = projectDir
