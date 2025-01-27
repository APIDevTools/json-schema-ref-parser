import eslint from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import prettierExtends from "eslint-config-prettier";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import tseslint from "typescript-eslint";

const globalToUse = {
  ...globals.browser,
  ...globals.serviceworker,
  ...globals.es2021,
  ...globals.worker,
  ...globals.node,
};

const ignores = [
  ".lintstagedrc.js",
  "**/.yarn/**/*",
  "**/dist/**/*",
  "public/js/*",
  ".yarn/js/*",
  "dist/**/*",
  "coverage/**/*",
];
/** @type {import('@typescript-eslint/utils').FlatConfig.ConfigArray} */
const configs = tseslint.config(
  {
    ignores,

    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, prettierExtends],
    plugins: {
      prettierPlugin,
      "unused-imports": fixupPluginRules(unusedImportsPlugin),
    },
    rules: {
      "prefer-rest-params": "off",
      "prefer-const": "error",
      "prefer-spread": "off",
      "no-case-declarations": "off",
      curly: ["error", "all"],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-use-before-define": ["off"],
      "object-shorthand": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "unused-imports/no-unused-imports": "error",
    },
    languageOptions: {
      globals: globalToUse,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  { ignores },
);
export default configs;
