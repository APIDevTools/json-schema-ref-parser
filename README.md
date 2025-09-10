> This is a modified fork to serve Hey API needs

# JSON Schema $Ref Parser

#### Parse, Resolve, and Dereference JSON Schema $ref pointers

<!-- [![Build Status](https://github.com/APIDevTools/json-schema-ref-parser/workflows/CI-CD/badge.svg?branch=master)](https://github.com/APIDevTools/json-schema-ref-parser/actions)
[![Coverage Status](https://coveralls.io/repos/github/APIDevTools/json-schema-ref-parser/badge.svg?branch=master)](https://coveralls.io/github/APIDevTools/json-schema-ref-parser) -->

<!-- [![npm](https://img.shields.io/npm/v/@apidevtools/json-schema-ref-parser.svg)](https://www.npmjs.com/package/@apidevtools/json-schema-ref-parser)
[![License](https://img.shields.io/npm/l/@apidevtools/json-schema-ref-parser.svg)](LICENSE) -->

## Installation

Install using [npm](https://docs.npmjs.com/about-npm/):

```bash
npm install @hey-api/json-schema-ref-parser
yarn add @hey-api/json-schema-ref-parser
bun add @hey-api/json-schema-ref-parser
```

## The Problem:

You've got a JSON Schema with `$ref` pointers to other files and/or URLs. Maybe you know all the referenced files ahead
of time. Maybe you don't. Maybe some are local files, and others are remote URLs. Maybe they are a mix of JSON and YAML
format. Maybe some of the files contain cross-references to each other.

```json
{
  "definitions": {
    "person": {
      // references an external file
      "$ref": "schemas/people/Bruce-Wayne.json"
    },
    "place": {
      // references a sub-schema in an external file
      "$ref": "schemas/places.yaml#/definitions/Gotham-City"
    },
    "thing": {
      // references a URL
      "$ref": "http://wayne-enterprises.com/things/batmobile"
    },
    "color": {
      // references a value in an external file via an internal reference
      "$ref": "#/definitions/thing/properties/colors/black-as-the-night"
    }
  }
}
```

## The Solution:

JSON Schema $Ref Parser is a full [JSON Reference](https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03)
and [JSON Pointer](https://tools.ietf.org/html/rfc6901) implementation that crawls even the most
complex [JSON Schemas](http://json-schema.org/latest/json-schema-core.html) and gives you simple, straightforward
JavaScript objects.

- Use **JSON** or **YAML** schemas &mdash; or even a mix of both!
- Supports `$ref` pointers to external files and URLs, as well as custom sources such as databases
- Can bundle multiple files into a single schema that only has _internal_ `$ref` pointers
- Can dereference your schema, producing a plain-old JavaScript object that's easy to work with
- Supports circular references, nested references,
  back-references, and cross-references between files
- Maintains object reference equality &mdash; `$ref` pointers to the same value always resolve to the same object
  instance
- Compatible with Node LTS and beyond, and all major web browsers on Windows, Mac, and Linux

## Example

```javascript
import { $RefParser } from "@hey-api/json-schema-ref-parser";

try {
  const parser = new $RefParser();
  await parser.dereference({ pathOrUrlOrSchema: mySchema });
  console.log(parser.schema.definitions.person.properties.firstName);
} catch (err) {
  console.error(err);
}
```

### New in this fork (@hey-api)

- **Multiple inputs with `bundleMany`**: Merge and bundle several OpenAPI/JSON Schema inputs (files, URLs, or raw objects) into a single schema. Components are prefixed to avoid name collisions, paths are namespaced on conflict, and `$ref`s are rewritten accordingly.

```javascript
import { $RefParser } from "@hey-api/json-schema-ref-parser";

const parser = new $RefParser();
const merged = await parser.bundleMany({
  pathOrUrlOrSchemas: [
    "./specs/a.yaml",
    "https://example.com/b.yaml",
    { openapi: "3.1.0", info: { title: "Inline" }, paths: {} },
  ],
});

// merged.components.* will contain prefixed names like a_<name>, b_<name>, etc.
```

- **Dereference hooks**: Fine-tune dereferencing with `excludedPathMatcher(path) => boolean` to skip subpaths and `onDereference(path, value, parent, parentPropName)` to observe replacements.

```javascript
const parser = new $RefParser();
parser.options.dereference.excludedPathMatcher = (p) => p.includes("/example/");
parser.options.dereference.onDereference = (p, v) => {
  // inspect p / v as needed
};
await parser.dereference({ pathOrUrlOrSchema: "./openapi.yaml" });
```

- **Smart input resolution**: You can pass a file path, URL, or raw schema object. If a raw schema includes `$id`, it is used as the base URL for resolving relative `$ref`s.

```javascript
await new $RefParser().bundle({
  pathOrUrlOrSchema: {
    $id: "https://api.example.com/openapi.json",
    openapi: "3.1.0",
    paths: {
      "/ping": { get: { responses: { 200: { description: "ok" } } } },
    },
  },
});
```

## Polyfills

If you are using Node.js < 18, you'll need a polyfill for `fetch`,
like [node-fetch](https://github.com/node-fetch/node-fetch):

```javascript
import fetch from "node-fetch";

globalThis.fetch = fetch;
```

## Browser support

JSON Schema $Ref Parser supports recent versions of every major web browser. Older browsers may
require [Babel](https://babeljs.io/) and/or [polyfills](https://babeljs.io/docs/en/next/babel-polyfill).

To use JSON Schema $Ref Parser in a browser, you'll need to use a bundling tool such
as [Webpack](https://webpack.js.org/), [Rollup](https://rollupjs.org/), [Parcel](https://parceljs.org/),
or [Browserify](http://browserify.org/). Some bundlers may require a bit of configuration, such as
setting `browser: true` in [rollup-plugin-resolve](https://github.com/rollup/rollup-plugin-node-resolve).

#### Webpack 5

Webpack 5 has dropped the default export of node core modules in favour of polyfills, you'll need to set them up
yourself ( after npm-installing them )
Edit your `webpack.config.js` :

```js
config.resolve.fallback = {
  path: require.resolve("path-browserify"),
  fs: require.resolve("browserify-fs"),
};

config.plugins.push(
  new webpack.ProvidePlugin({
    Buffer: ["buffer", "Buffer"],
  }),
);
```

#### Building/Testing

To build/test the project locally on your computer:

1. **Clone this repo**<br>
   `git clone https://github.com/APIDevTools/json-schema-ref-parser.git`

2. **Install dependencies**<br>
   `yarn install`

3. **Run the tests**<br>
   `yarn test`
