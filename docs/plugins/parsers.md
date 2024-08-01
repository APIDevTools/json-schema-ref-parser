# Custom Parsers

JSON Schema $Ref Parser comes with built-in JSON, YAML, plain-text, and binary parsers, but you can add your own parsers to support additional file types, or even replace any of the built-in parsers with your own custom implementation.

You can see the source code for any of the built-in parsers [right here](../../lib/parsers).

#### Simple Example: Creating your own parser

The fastest way to learn is by example, so let's do that. Here's a simplistic parser that parses CSV files (comma-separated values):

```javascript
let myParser = {
  order: 1,

  canParse: ".csv",

  parse(file) {
    let lines = file.data.toString().split("\n");
    return lines.map((line) => {
      return line.split(",");
    });
  },
};

$RefParser.dereference(mySchema, { parse: { csv: myParser } });
```

#### The `order` property

All parsers have an `order` property, even the built-in parsers. If you don't specify an `order` property, then your parser will run last. Specifying `order: 1`, like we did in this example, will make your parser run first. Or you can squeeze your parser in-between some of the built-in parsers. For example, `order: 201` would make it run _after_ the JSON and YAML parsers, but _before_ the plain-text and binary parsers. You can see the order of all the built-in parsers by looking at [their source code](../../lib/parsers).

The `order` property and `canParse` property are related to each other. For each file that JSON Schema $Ref Parser needs to parse, it first determines which parsers _can_ parse that file by checking their `canParse` property. If only one parser matches a file, then _only_ that one parser is called, regardless of its `order`. If multiple parsers match a file, then those parsers are tried _in order_ until one of them successfully parses the file. Once a parser successfully parses the file, the rest of the parsers are skipped.

If _none_ of the parsers match the file, then _all_ of them are tried, in order, until one of them successfuly parses the file, or until they all fail. This is useful for situations where a file _is_ a supported type, but it has an unrecognized file extension.

#### The `canParse` property

The `canParse` property tells JSON Schema $Ref Parser what kind of files your parser can handle. In this example, we've simply specified a file extension, but we could have used a simple boolean, an array of file extensions, a regular expression, or even a function with custom logic to determine which files to parse. Here are examples of each approach:

```javascript
let myParser = {
  // Parse ALL file types
  canParse: true

  // An array of file extensions (lowercased)
  canParse: [".txt", ".csv"]

  // A regular expression (matched against the FULL file path)
  canParse: /\.(txt|csv)$/i

  // A function that returns a truthy/falsy value
  canParse(file) {
    return file.extension === ".csv" || file.extension === ".txt";
  }
};
```

When using the function form, the `file` parameter is a [file info object](file-info-object.md), which contains information about the file being parsed.

#### The `parse` method

Obviously, this is where the real work of a parser happens. The `parse` method accepts the same [file info object](file-info-object.md) as the `canParse` function, but rather than returning a boolean value, the `parse` method should return a JavaScript representation of the file contents. For our CSV parser, that is a two-dimensional array of lines and values. For your parser, it might be an object, a string, a custom class, or anything else.

Unlike the `canParse` function, the `parse` method can also be asynchronous. This might be important if your parser needs to retrieve data from a database or if it relies on an external HTTP service to return the parsed value. You can return your asynchronous value via a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or a Node.js-style error-first callback. Here are examples of both approaches:

```javascript
let myCallbackParser = {
  // Return the value in a callback function
  parse(file, callback) {
    doSomethingAsync(file.data, (data) => {
      if (data) {
        // Success !
        callback(null, data);
      } else {
        // Error !
        callback(new Error("No data!"));
      }
    });
  },
};

let myPromiseParser = {
  // Return the value in an ES6 Promise
  async parse(file) {
    let data = await doSomethingAsync(file.data);

    if (data) {
      // Success !
      return data;
    } else {
      // Error !
      throw new Error("No data!");
    }
  },
};
```
