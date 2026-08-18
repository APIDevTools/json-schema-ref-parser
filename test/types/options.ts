import type { ParserOptions } from "../../lib/index.js";

const options: ParserOptions = {
  resolve: {
    excludedPathMatcher(path, value) {
      const matcherPath: string = path;
      const matcherValue: unknown = value;

      return matcherPath === "#/example" && matcherValue !== undefined;
    },
    custom: {
      canRead: true,
      read: "custom resolver value",
    },
  },
};

const customResolver = options.resolve?.custom;
if (customResolver && typeof customResolver === "object") {
  const canRead = customResolver.canRead;
  void canRead;
}

const invalidCustomResolver: ParserOptions = {
  resolve: {
    // @ts-expect-error Custom resolvers must be resolver options or a boolean.
    custom: 42,
  },
};

const invalidMatcher: ParserOptions = {
  resolve: {
    // @ts-expect-error The excluded path matcher must be callable.
    excludedPathMatcher: "not callable",
  },
};

void invalidCustomResolver;
void invalidMatcher;
