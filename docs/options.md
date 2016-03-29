Options
==========================

All [`$RefParser`](ref-parser.md) methods accept an optional `options` parameter, which you can use to customize how the JSON Schema is parsed, resolved, dereferenced, etc.

If you pass an options parameter, you _don't_ need to specify _every_ option.  Any options you don't specify will use their default values.

Example
-------------------

```javascript
$RefParser.dereference("my-schema.yaml", {
  parse: {
    json: false,               // Disable the JSON parser
    yaml: {
      empty: false             // Don't allow empty YAML files
    },
    text: {
      ext: [".txt", ".html"],  // Parse .txt and .html files as plain text (strings)
      encoding: 'utf16'        // Use UTF-16 encoding
    }
  },
  resolve: {
    file: false,               // Don't resolve local file references
    http: {
      timeout: 2000            // 2 second timeout
    }
  },
  dereference: {
    circular: false            // Don't allow circular $refs
  }
});
```


`parse` Options
-------------------
The `parse` options determine how different types of files will be parsed.  JSON Schema $Ref Parser comes with built-in JSON, YAML, plain-text, and binary parsers, any of which you can configure or disable.  You can also add your own custom parsers if you want.

#### Disabling a parser
To disable a parser, just set it to `false`, like this:

```javascript
// Disable the JSON parser
$RefParser.dereference("my-schema.yaml", { parse: { json: false } });
```

#### `order`
Parsers run in a specific order, relative to other parsers. For example, a parser with `order: 5` will run _before_ a parser with `order: 10`.  If a parser is unable to successfully parse a file, then the next parser is tried, until one succeeds or they all fail.

You can change the order in which parsers run, which is useful if you know that most of your referenced files will be a certain type, or if you add your own custom parser that you want to run _first_.

```javascript
// Run the plain-text parser first
$RefParser.dereference("my-schema.yaml", { parse: { text: { order: 1 } } });
```

#### `ext`
Each parser has a list of file extensions that it will try to parse.  For example, the plain-text parser will parse most common text files, such as `.txt`, `.html`, `.xml`, etc.

Multiple parsers can contain the same file extensions. For example, both the JSON parser _and_ the YAML parser will parse `.json` files.  In this case, the JSON parser will run _first_, because it has `order: 100` and the YAML parser has `order: 200`.

You can set your own file extensions for any parser.  Each extension can be a string or a regular expression to test against the _full file path_.  Here's an example:

```javascript
$RefParser.dereference("my-schema.yaml", {
  parse: {
    text: {
        // parse text, html, and readme files as plain-text
        ext: [".txt", ".html", /docs\/README/i]
    }
  }
});
```

#### `empty`
All of the built-in parsers allow empty files by default. The JSON and YAML parsers will parse empty files as `undefined`. The text parser will parse empty files as an empty string.  The binary parser will parse empty files as an empty byte array.

You can set `empty: false` on any parser, which will cause an error to be thrown if a file empty.

#### Parser-specific options
Parsers can have other options that are specific to that parser.  Currently, the only such option is `text.encoding`, which allows you to set the encoding for parsing text-based files.  The default encoding is `utf8`.

#### Adding a custom parser
To add your own custom parser, just define a function that accepts the following parameters:

|Parameter  |Type       |Description
|:----------|:----------|:----------
|`data`     |`string`, [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer), `object`, etc.|This is the file data to be parsed. This will usually be a Buffer object, which allows you to efficiently process binary data formats, if necessary. Or you can just call its `.toString()` method to convert it to a string.<br><br>The actual data type of this parameter depends on the [resolver](#resolve-options) that read the file. The built-in resolvers return Buffer objects, but custom resolvers could potentially return any data type.
|`path`     |`string`   |The file path or URL that `data` came from. This may be useful if your parser needs to perform conditional logic based on the file's source or file extension.
|`options`  |[`options`](options.md) |The full options object. This may be useful if your parser needs to perform conditional logic based on the options that were specified.
|`callback` |`function` |Your parser _must_ either return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or call this callback. The first parameter of the callback should be `null` if `data` was parsed successfully; otherwise, it should be an Error object. The second parameter is the parsed value, which can be any JavaScript type.

Here is a simple example of a custom parser.  For more complex examples refer to any of [the built-in parsers](../lib/parse).

```javascript
  // A custom parser that returns reversed strings
  function myCustomParser(data, path, options, callback) {
    var reversed = data.toString().split('').reverse().join('');
    callback(null, reversed);
  }

  // This parser only parses .foo files
  myCustomParser.ext = '.foo';

  // This parser runs first (before any other parsers)
  myCustomParser.order = 1;

  // Use the custom parser
  $RefParser.dereference(mySchema, {parse: {custom: myCustomParser}});
```


`resolve` Options
-------------------
The `resolve` options control how JSON Schema $Ref Parser will resolve file paths and URLs, and how those files will be read/downloaded.

JSON Schema $Ref Parser comes with built-in support for HTTP and HTTPS, as well as support for local files (when running in Node.js).  You can configure or disable either of these built-in resolvers. You can also add your own custom resolvers if you want.

#### Disabling a resolver
To disable a resolver, just set it to `false`, like this:

```javascript
// Disable HTTP/HTTPS support
$RefParser.dereference("my-schema.yaml", { resolve: { http: false } });
```

#### `order`
Resolvers run in a specific order, relative to other resolvers. For example, a resolver with `order: 5` will run _before_ a resolver with `order: 10`.  If a resolver is unable to successfully resolve a path, then the next resolver is tried, until one succeeds or they all fail.

You can change the order in which resolvers run, which is useful if you know that most of your file references will be a certain type, or if you add your own custom resolver that you want to run _first_.

```javascript
// Run the HTTP resolver first
$RefParser.dereference("my-schema.yaml", { resolve: { http: { order: 1 } } });
```

#### Resolver-specific options
Resolvers can have other options that are specific to that resolver.  For example, the [HTTP resolver](../lib/read/http.js) has options that allow you to customize the HTTP headers, timeout, credentials, etc.

#### Adding a custom resolver
To add your own custom resolver, just define a function that accepts the following parameters:

|Parameter  |Type       |Description
|:----------|:----------|:----------
|`path`     |`string`   |The path to resolve. The path will already be resolved according to [RFC 3986](https://tools.ietf.org/html/rfc3986#section-5.2), as required by [JSON Reference](https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03#section-4). It will not contain any URL fragment, as that will be parsed separately, according to [RFC 6901 (JSON Pointer)](https://tools.ietf.org/html/rfc6901)
|`options`  |[`options`](options.md) |The full options object. This may be useful if your resolver needs to perform conditional logic based on the options that were specified.
|`callback` |`function` |Your parser _must_ either return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or call this callback. The first parameter of the callback should be `null` if the file was successfully resolved; otherwise, it should be an Error object. The second parameter is the resolved file contents, which can be any data type, but a [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer) is recommended.

Here is a simple example of a custom resolver.  For more complex examples refer to any of [the built-in resolvers](../lib/read).

```javascript
  // A custom resolver that reads from a MongoDB database
  function mongoDb(path, options, callback) {
    // If it's not a MongoDB URL, then error-out, so the next resolver can be tried
    if (path.substr(0, 10) !== "mongodb://") {
      callback("Not a MongoDB URL");
    }

    mongoClient.connect(path, function(err, db) {
      if (err) {
        callback(err);
      }
      else {
        db.collection("documents").find({}, callback);
      }
    });
  }

  // This parser only parses .foo files
  myCustomParser.ext = '.foo';

  // This parser runs first (before any other parsers)
  myCustomParser.order = 1;

  // Use the custom parser
  $RefParser.dereference(mySchema, {parse: {custom: myCustomParser}});
```




`dereference` Options
-------------------


|Option                |Type     |Default   |Description
|:---------------------|:--------|:---------|:----------
|`$refs.circular`      |bool or "ignore"     |true      |Determines whether [circular `$ref` pointers](README.md#circular-refs) are allowed. If `false`, then a `ReferenceError` will be thrown if the schema contains a circular reference.<br><br> If set to `"ignore"`, then circular references will _not_ be dereferenced, even when calling [`dereference()`](ref-parser.md#dereferenceschema-options-callback). No error will be thrown, but the [`$Refs.circular`](refs.md#circular) property will still be set to `true`.
|`http.headers`        |object   |`{}`      |HTTP to send when downloading files<br> (note: [some headers are protected](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name) and cannot be set)
|`http.timeout`        |number   |5000      |The HTTP request timeout (in milliseconds)
|`http.redirects`      |number   |5         |The maximum number of HTTP redirects to follow.  To disable automatic following of redirects, set this to zero.
|`http.withCredentials`|bool     |false     |When used in browser specifies [`withCredentials`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials) option of [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) object. Set this to `true` if you're downloading files from a CORS-enabled server that requries authentication
