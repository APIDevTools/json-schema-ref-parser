# Options

All [`$RefParser`](ref-parser.md) methods accept an optional `options` parameter, which you can use to customize how the JSON Schema is parsed, resolved, dereferenced, etc.

If you pass an options parameter, you _don't_ need to specify _every_ option. Any options you don't specify will use their default values.

## Example

```javascript
$RefParser.dereference("my-schema.yaml", {
  continueOnError: true, // Don't throw on the first error
  parse: {
    json: false, // Disable the JSON parser
    yaml: {
      allowEmpty: false, // Don't allow empty YAML files
    },
    text: {
      canParse: [".txt", ".html"], // Parse .txt and .html files as plain text (strings)
      encoding: "utf16", // Use UTF-16 encoding
    },
  },
  resolve: {
    file: false, // Don't resolve local file references
    http: {
      timeout: 2000, // 2 second timeout
      withCredentials: true, // Include auth credentials when resolving HTTP references
    },
  },
  dereference: {
    circular: false, // Don't allow circular $refs
    excludedPathMatcher: (
      path, // Skip dereferencing content under any 'example' key
    ) => path.includes("/example/"),
    onCircular: (
      path, // Callback invoked during circular $ref detection
    ) => console.log(path),
    onDereference: (
      path,
      value, // Callback invoked during dereferencing
    ) => console.log(path, value),
  },
});
```

## `parse` Options

The `parse` options determine how different types of files will be parsed.

JSON Schema $Ref Parser comes with built-in JSON, YAML, plain-text, and binary parsers, any of which you can configure or disable. You can also add [your own custom parsers](plugins/parsers.md) if you want.

| Option(s)                                                                 | Type                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :------------------------------------------------------------------------ | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `json`<br>`yaml`<br>`text`<br>`binary`                                    | `object` `boolean`                                 | These are the built-in parsers. In addition, you can add [your own custom parsers](plugins/parsers.md)<br><br>To disable a parser, just set it to `false`.                                                                                                                                                                                                                                                                                                                                                   |
| `json.order` `yaml.order` `text.order` `binary.order`                     | `number`                                           | Parsers run in a specific order, relative to other parsers. For example, a parser with `order: 5` will run _before_ a parser with `order: 10`. If a parser is unable to successfully parse a file, then the next parser is tried, until one succeeds or they all fail.<br><br>You can change the order in which parsers run, which is useful if you know that most of your referenced files will be a certain type, or if you add [your own custom parser](plugins/parsers.md) that you want to run _first_. |
| `json.allowEmpty` `yaml.allowEmpty` `text.allowEmpty` `binary.allowEmpty` | `boolean`                                          | All of the built-in parsers allow empty files by default. The JSON and YAML parsers will parse empty files as `undefined`. The text parser will parse empty files as an empty string. The binary parser will parse empty files as an empty byte array.<br><br>You can set `allowEmpty: false` on any parser, which will cause an error to be thrown if a file empty.                                                                                                                                         |
| `json.canParse` `yaml.canParse` `text.canParse` `binary.canParse`         | `boolean`, `RegExp`, `string`, `array`, `function` | Determines which parsers will be used for which files.<br><br>A regular expression can be used to match files by their full path. A string (or array of strings) can be used to match files by their file extension. Or a function can be used to perform more complex matching logic. See the [custom parser](plugins/parsers.md) docs for details.                                                                                                                                                         |
| `text.encoding`                                                           | `string`                                           | The encoding to use when parsing text-based files. The default is "utf8".                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## `resolve` Options

The `resolve` options control how JSON Schema $Ref Parser will resolve file paths and URLs, and how those files will be read/downloaded.

JSON Schema $Ref Parser comes with built-in support for HTTP and HTTPS, as well as support for local files (when running in Node.js). You can configure or disable either of these built-in resolvers. You can also add [your own custom resolvers](plugins/resolvers.md) if you want.

| Option(s)                     | Type                                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| :---------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `external`                    | `boolean`                                          | Determines whether external $ref pointers will be resolved. If this option is disabled, then external $ref pointers will simply be ignored.                                                                                                                                                                                                                                                                                                                                                                                     |
| `file`<br>`http`              | `object` `boolean`                                 | These are the built-in resolvers. In addition, you can add [your own custom resolvers](plugins/resolvers.md)<br><br>To disable a resolver, just set it to `false`.                                                                                                                                                                                                                                                                                                                                                              |
| `file.order` `http.order`     | `number`                                           | Resolvers run in a specific order, relative to other resolvers. For example, a resolver with `order: 5` will run _before_ a resolver with `order: 10`. If a resolver is unable to successfully resolve a path, then the next resolver is tried, until one succeeds or they all fail.<br><br>You can change the order in which resolvers run, which is useful if you know that most of your file references will be a certain type, or if you add [your own custom resolver](plugins/resolvers.md) that you want to run _first_. |
| `file.canRead` `http.canRead` | `boolean`, `RegExp`, `string`, `array`, `function` | Determines which resolvers will be used for which files.<br><br>A regular expression can be used to match files by their full path. A string (or array of strings) can be used to match files by their file extension. Or a function can be used to perform more complex matching logic. See the [custom resolver](plugins/resolvers.md) docs for details.                                                                                                                                                                      |
| `http.headers`                | `object`                                           | You can specify any HTTP headers that should be sent when downloading files. For example, some servers may require you to set the `Accept` or `Referrer` header.                                                                                                                                                                                                                                                                                                                                                                |
| `http.timeout`                | `number`                                           | The amount of time (in milliseconds) to wait for a response from the server when downloading files. The default is 60 seconds.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `http.redirects`              | `number`                                           | The maximum number of HTTP redirects to follow per file. The default is 5. To disable automatic following of redirects, set this to zero.                                                                                                                                                                                                                                                                                                                                                                                       |
| `http.withCredentials`        | `boolean`                                          | Set this to `true` if you're downloading files from a CORS-enabled server that requires authentication                                                                                                                                                                                                                                                                                                                                                                                                                          |

## `dereference` Options

The `dereference` options control how JSON Schema $Ref Parser will dereference `$ref` pointers within the JSON schema.

| Option(s)             | Type                                                                   | Description                                                                                                                                                                                                                                                                                                                                                                                     |
| :-------------------- | :--------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `circular`            | `boolean` or `"ignore"`                                                | Determines whether [circular `$ref` pointers](README.md#circular-refs) are handled.<br><br>If set to `false`, then a `ReferenceError` will be thrown if the schema contains any circular references.<br><br> If set to `"ignore"`, then circular references will simply be ignored. No error will be thrown, but the [`$Refs.circular`](refs.md#circular) property will still be set to `true`. |
| `excludedPathMatcher` | `(string) => boolean`                                                  | A function, called for each path, which can return true to stop this path and all subpaths from being dereferenced further. This is useful in schemas where some subpaths contain literal `$ref` keys that should not be dereferenced.                                                                                                                                                          |
| `onCircular`          | `(string) => void`                                                     | A function, called immediately after detecting a circular `$ref` with the circular `$ref` in question.                                                                                                                                                                                                                                                                                          |
| `onDereference`       | `(string, JSONSchemaObjectType, JSONSchemaObjectType, string) => void` | A function, called immediately after dereferencing, with: the resolved JSON Schema value, the `$ref` being dereferenced, the object holding the dereferenced prop, the dereferenced prop name.                                                                                                                                                                                                  |
| `preservedProperties` | `string[]`                                                             | An array of properties to preserve when dereferencing a `$ref` schema. Useful if you want to enforce non-standard dereferencing behavior like present in the OpenAPI 3.1 specification where `description` and `summary` properties are preserved when alongside a `$ref` pointer.                                                                                                              |
