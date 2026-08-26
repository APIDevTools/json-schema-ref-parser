import type { ExcludedPathMatcher, ParserOptions } from "../../lib/index.js";

const exportedMatcher: ExcludedPathMatcher = (path, value) => path === "#" && value !== undefined;

const valueAwareOptions: ParserOptions = {
  resolveExcludedPathMatcher(path, value) {
    const checkedPath: string = path;
    const checkedValue: unknown = value;
    return checkedPath === "#" && checkedValue !== undefined;
  },
  resolve: {
    custom: {
      canRead: true,
      read: "{}",
    },
  },
  bundle: {
    excludedPathMatcher(path, value) {
      return path === "#/bundle" && value !== undefined;
    },
  },
  dereference: {
    excludedPathMatcher(path, value) {
      return path === "#/dereference" && value !== undefined;
    },
  },
};

const pathOnlyOptions: ParserOptions = {
  resolveExcludedPathMatcher: (path) => path === "#/example",
};

const custom = valueAwareOptions.resolve?.custom;
if (custom && typeof custom !== "boolean") {
  custom.canRead;
}

const invalidMatcher: ParserOptions = {
  // @ts-expect-error Matchers must be callable.
  resolveExcludedPathMatcher: "not a matcher",
};

const invalidFunctionResolver: ParserOptions = {
  resolve: {
    // @ts-expect-error Custom resolvers cannot be bare functions.
    custom: () => true,
  },
};

const invalidNestedMatcher: ParserOptions = {
  resolve: {
    // @ts-expect-error Resolution matchers are top-level so resolver plugins remain soundly typed.
    excludedPathMatcher: () => true,
  },
};

const invalidNumericResolver: ParserOptions = {
  resolve: {
    // @ts-expect-error Custom resolvers cannot be numbers.
    custom: 42,
  },
};

void pathOnlyOptions;
void invalidMatcher;
void invalidFunctionResolver;
void invalidNestedMatcher;
void invalidNumericResolver;
void exportedMatcher;
