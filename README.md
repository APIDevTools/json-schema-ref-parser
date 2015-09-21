JSON Schema $Ref Parser
============================
#### Parse, Resolve, and Dereference JSON Schema $ref pointers

[![Build Status](https://api.travis-ci.org/BigstickCarpet/json-schema-ref-parser.svg)](https://travis-ci.org/BigstickCarpet/json-schema-ref-parser)
[![Dependencies](https://david-dm.org/BigstickCarpet/json-schema-ref-parser.svg)](https://david-dm.org/BigstickCarpet/json-schema-ref-parser)
[![Coverage Status](https://coveralls.io/repos/BigstickCarpet/json-schema-ref-parser/badge.svg?branch=master&service=github)](https://coveralls.io/r/BigstickCarpet/json-schema-ref-parser)
[![Code Climate Score](https://codeclimate.com/github/BigstickCarpet/json-schema-ref-parser/badges/gpa.svg)](https://codeclimate.com/github/BigstickCarpet/json-schema-ref-parser)
[![Codacy Score](https://www.codacy.com/project/badge/d8abfe5e9a4044b89bd9f4b999d4a574)](https://www.codacy.com/public/jamesmessinger/json-schema-ref-parser)
[![Inline docs](http://inch-ci.org/github/BigstickCarpet/json-schema-ref-parser.svg?branch=master&style=shields)](http://inch-ci.org/github/BigstickCarpet/json-schema-ref-parser)

[![npm](http://img.shields.io/npm/v/json-schema-ref-parser.svg)](https://www.npmjs.com/package/json-schema-ref-parser)
[![Bower](http://img.shields.io/bower/v/json-schema-ref-parser.svg)](#bower)
[![License](https://img.shields.io/npm/l/json-schema-ref-parser.svg)](LICENSE)

[![Browser Compatibility](https://saucelabs.com/browser-matrix/json-schema-parser.svg)](https://saucelabs.com/u/json-schema-parser)


The Problem:
--------------------------
You've got a JSON Schema with `$ref` pointers to other files and/or URLs.  Maybe you know all the referenced files ahead of time.  Maybe you don't.  Maybe some are local files, and others are remote URLs.  Maybe they are a mix of JSON and YAML format.  Maybe some of the files contain cross-references to each other.

```javascript
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


The Solution:
--------------------------
JSON Schema $Ref Parser is a full [JSON Reference](https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03) and [JSON Pointer](https://tools.ietf.org/html/rfc6901) implementation that crawls even the most complex [JSON Schemas](http://json-schema.org/latest/json-schema-core.html) and gives you simple, straightforward JavaScript objects.

- Use **JSON** or **YAML** schemas &mdash; or even a mix of both!
- Fully supports `$ref` pointers to external files and URLs
- Configurable caching of referenced files
- Can [bundle](#bundlepath-options-callback) multiple files into a single schema that only has _internal_ `$ref` pointers
- Can [dereference](#dereferencepath-options-callback) your schema, producing a plain-old JavaScript object that's easy to work with
- Supports [circular references](#circular-refs), nested references, back-references, and cross-references between files
- Maintains object reference equality &mdash `$ref` pointers to the same value always resolve to the same object instance
- [Tested](http://bigstickcarpet.github.io/json-schema-ref-parser/tests/index.html) in Node, io.js, and all major web browsers on Windows, Mac, and Linux


Example
--------------------------

```javascript
$RefParser.dereference(mySchema, function(err, schema) {
  if (err) {
    console.error(err);
  }
  else {
    // `schema` is just a normal JavaScript object that contains your
    // entire JSON Schema - even if it spans multiple files
    console.log(schema.definitions.person.properties.firstName);
  }
});
```

Or use [Promises syntax](http://javascriptplayground.com/blog/2015/02/promises/) instead. The following example is the same as above:

```javascript
$RefParser.dereference(mySchema)
  .then(function(schema) {
    console.log(schema.definitions.person.properties.firstName);
  })
  .catch(function(err) {
    console.error(err);
  });
```


Installation
--------------------------
#### Node
Install using [npm](https://docs.npmjs.com/getting-started/what-is-npm):

```bash
npm install json-schema-ref-parser
```

Then require it in your code:

```javascript
var $RefParser = require('json-schema-ref-parser');
```

#### Web Browsers
Install using [bower](http://bower.io/):

```bash
bower install json-schema-ref-parser
```

Then reference [`ref-parser.js`](dist/ref-parser.js) or [`ref-parser.min.js`](dist/ref-parser.min.js) in your HTML:

```html
<script src="bower_components/json-schema-ref-parser/dist/ref-parser.js"></script>
```

Or, if you're using AMD (Require.js), then import it into your module:

```javascript
define(["ref-parser"], function($RefParser) { /* your module's code */ })
```


The API
--------------------------
- Methods
    - [`dereference()`](#dereferencepath-options-callback)
    - [`bundle()`](#bundlepath-options-callback)
    - [`parse()`](#parsepath-options-callback)
    - [`resolve()`](#resolvepath-options-callback)
- Objects
    - [`Options`](#options)
    - [`Schema`](#schema-object)
    - [`$Refs`](#refs-object)
      - [`$Refs.paths()`](#refspathstypes)
      - [`$Refs.values()`](#refsvaluestypes)
      - [`$Refs.isExpired()`](#refsisexpiredref)
      - [`$Refs.expire()`](#refsexpireref)
      - [`$Refs.exists()`](#refsexistsref)
      - [`$Refs.get()`](#refsgetref-options)
      - [`$Refs.set()`](#refssetref-value-options)
    - [`YAML`](#yaml-object)
      - [`YAML.parse()`](#yamlparsetext)
      - [`YAML.stringify()`](#yamlstringifyvalue)
- [Class methods vs. Instance methods](#class-methods-vs-instance-methods)
- [Callbacks vs. Promises](#callbacks-vs-promises)


### `dereference(schema, [options], [callback])`

- **schema** (_required_) - `string` or `object`<br>
A JSON Schema object, or the file path or URL of a JSON Schema file.  See the [`parse`](#parseschema-options-callback) method for more info.

- **options** (_optional_) - `object`<br>
See [options](#options) below.

- **callback** (_optional_) - `function(err, schema)`<br>
A callback that will receive the dereferenced schema object.

- **Return Value:** `Promise`<br>
See [Callbacks vs. Promises](#callbacks-vs-promises) below.

Dereferences all `$ref` pointers in the JSON Schema, replacing each reference with its resolved value.  This results in a schema object that does not contain _any_ `$ref` pointers.  Instead, it's a normal JavaScript object tree that can easily be crawled and used just like any other JavaScript object.  This is great for programmatic usage, especially when using tools that don't understand JSON references.

The `dereference` method maintains object reference equality, meaning that all `$ref` pointers that point to the same object will be replaced with references to the same object.  Again, this is great for programmatic usage, but it does introduce the risk of [circular references](#circular-refs), so be careful if you intend to serialize the schema using [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).  Consider using the [`bundle`](#bundlepath-options-callback) method instead, which does not create circular references.

```javascript
$RefParser.dereference("my-schema.yaml")
  .then(function(schema) {
    // The `schema` object is a normal JavaScript object,
    // so you can easily access any part of the schema using simple dot notation
    console.log(schema.definitions.person.properties.firstName); // => {type: "string"}

    // Object reference equality works as expected
    schema.definitions.thing === schema.definitions.batmobile;   // => true
  });
```


### `bundle(schema, [options], [callback])`

- **schema** (_required_) - `string` or `object`<br>
A JSON Schema object, or the file path or URL of a JSON Schema file.  See the [`parse`](#parseschema-options-callback) method for more info.

- **options** (_optional_) - `object`<br>
See [options](#options) below.

- **callback** (_optional_) - `function(err, schema)`<br>
A callback that will receive the bundled schema object.

- **Return Value:** `Promise`<br>
See [Callbacks vs. Promises](#callbacks-vs-promises) below.

Bundles all referenced files/URLs into a single schema that only has _internal_ `$ref` pointers.  This lets you split-up your schema however you want while you're building it, but easily combine all those files together when it's time to package or distribute the schema to other people.  The resulting schema size will be small, since it will still contain _internal_ JSON references rather than being [fully-dereferenced](#dereferencepath-options-callback).

This also eliminates the risk of [circular references](#circular-refs), so the schema can be safely serialized using [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

```javascript
$RefParser.bundle("my-schema.yaml")
  .then(function(schema) {
    console.log(schema.definitions.person); // => {$ref: "#/definitions/schemas~1people~1Bruce-Wayne.json"}
  });
```


### `parse(schema, [options], [callback])`

- **schema** (_required_) - `string` or `object`<br>
A JSON Schema object, or the file path or URL of a JSON Schema file.
<br><br>
The path can be absolute or relative.  In Node, the path is relative to `process.cwd()`.  In the browser, it's relative to the URL of the page.

- **options** (_optional_) - `object`<br>
See [options](#options) below.

- **callback** (_optional_) - `function(err, schema)`<br>
A callback that will receive the parsed schema object, or an error.

- **Return Value:** `Promise`<br>
See [Callbacks vs. Promises](#callbacks-vs-promises) below.

> This method is used internally by other methods, such as [`bundle`](#bundlepath-options-callback) and [`dereference`](#dereferencepath-options-callback).  You probably won't need to call this method yourself.

Parses the given JSON Schema file (in JSON or YAML format), and returns it as a JavaScript object.  This method **does not** resolve `$ref` pointers or dereference anything.  It simply parses _one_ file and returns it.

```javascript
$RefParser.parse("my-schema.yaml")
  .then(function(schema) {
    console.log(schema.definitions.person); // => {$ref: "schemas/people/Bruce-Wayne.json"}
  });
```


### `resolve(schema, [options], [callback])`

- **path** (_required_) - `string` or `object`<br>
A JSON Schema object, or the file path or URL of a JSON Schema file.  See the [`parse`](#parseschema-options-callback) method for more info.

- **options** (_optional_) - `object`<br>
See [options](#options) below.

- **callback** (_optional_) - `function(err, $refs)`<br>
A callback that will receive a [`$Refs`](#refs-object) object.

- **Return Value:** `Promise`<br>
See [Callbacks vs. Promises](#callbacks-vs-promises) below.

> This method is used internally by other methods, such as [`bundle`](#bundleschema-options-callback) and [`dereference`](#dereferenceschema-options-callback).  You probably won't need to call this method yourself.

Resolves all JSON references (`$ref` pointers) in the given JSON Schema file.  If it references any other files/URLs, then they will be downloaded and resolved as well (unless `options.$refs.external` is false).   This method **does not** dereference anything.  It simply gives you a [`$Refs`](#refs-object) object, which is a map of all the resolved references and their values.

```javascript
$RefParser.resolve("my-schema.yaml")
  .then(function($refs) {
    // $refs.paths() returns the paths of all the files in your schema
    var filePaths = $refs.paths();

    // $refs.get() lets you query parts of your schema
    var name = $refs.get("schemas/people/Bruce-Wayne.json#/properties/name");

    // $refs.set() lets you change parts of your schema
    $refs.set("schemas/people/Bruce-Wayne.json#/properties/favoriteColor/default", "black");
  });
```


### Options
You can pass an options parameter to any method.  You don't need to specify every option - only the ones you want to change.

```javascript
$RefParser.dereference("my-schema.yaml", {
    allow: {
        json: false,        // Don't allow JSON files
        yaml: true          // Allow YAML files
    },
    $refs: {
        internal: false     // Don't dereference internal $refs, only external
    },
    cache: {
        fs: 1,              // Cache local files for 1 second
        http: 600           // Cache http URLs for 10 minutes
    }
});
```

|Option           |Type     |Default   |Description
|:----------------|:--------|:---------|:----------
|`allow.json`     |bool     |true      |Determines whether JSON files are supported
|`allow.yaml`     |bool     |true      |Determines whether YAML files are supported<br> (note: all JSON files are also valid YAML files)
|`allow.empty`    |bool     |true      |Determines whether it's ok for a `$ref` pointer to point to an empty file
|`allow.unknown`  |bool     |true      |Determines whether it's ok for a `$ref` pointer to point to an unknown/unsupported file type (such as HTML, text, image, etc.). The default is to resolve unknown files as a [`Buffer`](https://nodejs.org/api/buffer.html#buffer_class_buffer)
|`$refs.internal` |bool     |true      |Determines whether internal `$ref` pointers (such as `#/definitions/widget`) will be dereferenced when calling [`dereference()`](#dereferenceschema-options-callback).  Either way, you'll still be able to get the value using [`$Refs.get()`](#refsgetref-options)
|`$refs.external` |bool     |true      |Determines whether external `$ref` pointers get resolved/dereferenced. If `false`, then no files/URLs will be retrieved.  Use this if you only want to allow single-file schemas.
|`$refs.circular` |bool     |true      |Determines whether [circular `$ref` pointers](#circular-refs) are allowed. If `false`, then a `ReferenceError` will be thrown if the schema contains a circular reference.
|`cache.fs`       |number   |60        |<a name="caching"></a>The length of time (in seconds) to cache local files.  The default is one minute.  Setting to zero will cache forever.
|`cache.http`     |number   |300       |The length of time (in seconds) to cache HTTP URLs.  The default is five minutes.  Setting to zero will cache forever.
|`cache.https`    |number   |300       |The length of time (in seconds) to cache HTTPS URLs.  The default is five minutes.  Setting to zero will cache forever.


### `Schema` Object
If you create an instance of the `$RefParser` class (rather than just calling the static methods), then the `schema` property gives you easy access to the JSON schema.  This is the same value that is passed to the callback function (or Promise) when calling the [`parse`](#parseschema-options-callback), [`bundle`](#bundleschema-options-callback), or [`dereference`](#dereferenceschema-options-callback) methods.

```javascript
var parser = new $RefParser();

parser.schema;  // => null

parser.dereference("my-schema.json")
  .then(function(schema) {
    typeof parser.schema;     // => "object"

    schema === parser.schema; // => true
  });
```


### `$Refs` Object
When you call the [`resolve`](#resolveschema-options-callback) method, the value that gets passed to the callback function (or Promise) is a `$Refs` object.  This same object is accessible via the `parser.$refs` property of `$RefParser` instances.

This object is a map of JSON References and their resolved values.  It also has several convenient helper methods that make it easy for you to navigate and manipulate the JSON References.


### `$Refs.circular`

- **Type:** `boolean`

This property is `true` if the schema contains any [circular references](#circular-refs).  You may want to check this property before serializing the dereferenced schema as JSON, since [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) does not support circular references by default.

```javascript
var parser = new $RefParser();
parser.dereference("my-schema.json")
  .then(function() {
    if (parser.$refs.circular) {
      console.log('The schema contains circular references');
    }
  });
```


### `$Refs.paths([types])`

- **types** (_optional_) - `string` (one or more)<br>
Optionally only return certain types of paths ("fs", "http", "https")

- **Return Value:** `array` of `string`<br>
Returns the paths/URLs of all the files in your schema (including the main schema file).

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    // Get the paths of ALL files in the schema
    $refs.paths();

    // Get the paths of local files only
    $refs.paths("fs");

    // Get all URLs
    $refs.paths("http", "https");
  });
```

### `$Refs.values([types])`

- **types** (_optional_) - `string` (one or more)<br>
Optionally only return values from certain locations ("fs", "http", "https")

- **Return Value:** `object`<br>
Returns a map of paths/URLs and their correspond values.

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    // Get ALL paths & values in the schema
    // (this is the same as $refs.toJSON())
    var values = $refs.values();

    values["schemas/people/Bruce-Wayne.json"];
    values["schemas/places.yaml"];
    values["http://wayne-enterprises.com/things/batmobile"];
  });
```


### `$Refs.isExpired($ref)`

- **$ref** (_required_) - `string`<br>
The JSON Reference path, optionally with a JSON Pointer in the hash

- **Return Value:** `boolean`<br>
Returns `true` if the given JSON reference has expired (or if it doesn't exist); otherwise, returns `false`

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    // Hasn't expired yet
    $refs.isExpired("schemas/places.yaml");   // => false

    // Check again after 10 minutes
    setTimeout(function() {
      $refs.isExpired("schemas/places.yaml"); // => true
    }, 600000);
  });
```


### `$Refs.expire($ref)`

- **$ref** (_required_) - `string`<br>
The JSON Reference path, optionally with a JSON Pointer in the hash

Immediately expires the given JSON reference, so the next time you call a method such as [`parse`](#parseschema-options-callback) or [`dereference`](#dereferenceschema-options-callback), the file will be refreshed rather than reusing the cached value.

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    $refs.isExpired("schemas/places.yaml");   // => false

    $refs.expire("schemas/places.yaml");

    $refs.isExpired("schemas/places.yaml");   // => true
  });
```


### `$Refs.exists($ref)`

- **$ref** (_required_) - `string`<br>
The JSON Reference path, optionally with a JSON Pointer in the hash

- **Return Value:** `boolean`<br>
Returns `true` if the given path exists in the schema; otherwise, returns `false`

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    $refs.exists("schemas/places.yaml#/definitions/Gotham-City"); // => true
    $refs.exists("schemas/places.yaml#/definitions/Metropolis");  // => false
  });
```


### `$Refs.get($ref, [options])`

- **$ref** (_required_) - `string`<br>
The JSON Reference path, optionally with a JSON Pointer in the hash

- **options** (_optional_) - `object`<br>
See [options](#options) below.

- **Return Value:** `boolean`<br>
Gets the value at the given path in the schema. Throws an error if the path does not exist.

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    var value = $refs.get("schemas/people/Bruce-Wayne.json#/properties/address");
  });
```


### `$Refs.set($ref, value, [options])`

- **$ref** (_required_) - `string`<br>
The JSON Reference path, optionally with a JSON Pointer in the hash

- **value** (_required_)<br>
The value to assign. Can be anything (object, string, number, etc.)

- **options** (_optional_) - `object`<br>
See [options](#options) below.

Sets the value at the given path in the schema. If the property, or any of its parents, don't exist, they will be created.

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    $refs.set("schemas/people/Bruce-Wayne.json#/properties/favoriteColor/default", "black");
  });
```


### `YAML` object
This object provides simple YAML parsing functions.  JSON Schema $Ref Parser uses this object internally
for its own YAML parsing, but it is also exposed so you can use it in your code if needed.


### `YAML.parse(text)`

- **text** (_required_) - `string`<br>
The YAML string to be parsed.

- **Return Value:**<br>
Returns the parsed value, which can be any valid JSON type (object, array, string, number, etc.)

This method is similar to [`JSON.parse()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse), but it supports YAML _in addition_ to JSON (since any JSON document is also a valid YAML document).

```javascript
var YAML = $RefParser.YAML;
var text = "title: person \n" +
           "required: \n" +
           "  - name \n" +
           "  - age \n" +
           "properties: \n" +
           "  name: \n" +
           "    type: string \n" +
           "  age: \n" +
           "    type: number"

var obj = YAML.parse(text);

// {
//   title: "person",
//   required: ["name", "age"],
//   properties: {
//     name: {
//       type: "string"
//     },
//     age: {
//       type: "number"
//     }
//   }
// }
```


### `YAML.stringify(value)`

- **value** (_required_)<br>
The value to be converted to a YAML string. Can be any valid JSON type (object, array, string, number, etc.)

- **Return Value:** `string`<br>
Returns the a YAML string containing the serialized value

This method is similar to [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), except that it converts a value to a YAML string instead of a JSON string.

```javascript
var YAML = $RefParser.YAML;
var obj = {
  title: "person",
  required: ["name", "age"],
  properties: {
    name: {
      type: "string"
    },
    age: {
      type: "number"
    }
  }
};


var string = YAML.stringify(obj);

// title: person
// required:
//   - name
//   - age
// properties:
//   name:
//     type: string
//   age:
//     type: number
```


### Class methods vs. Instance methods
All of JSON Schema $Ref Parser's methods are available as static (class) methods, and as instance methods.  The static methods simply create a new `$RefParser` instance and then call the corresponding instance method.  Thus, the following line...

```javascript
$RefParser.resolve("my-schema.json");
```

... is the same as this:

```javascript
var parser = new $RefParser();
parser.resolve("my-schema.json");
```

The difference is that in the second example you now have a reference to `parser`, which means you can access the results ([`parser.schema`](#schema-object) and [`parser.$refs`](#refs-object)) anytime you want, rather than just in the callback function. Also, having a `$RefParser` instance allows you to benefit from **[caching](#caching)**, so the next time you call [`parser.resolve()`](#resolveschema-options-callback), it won't need to re-download those files again (as long as the cache hasn't expired).


### Callbacks vs. Promises
Many people prefer [ES6 Promise syntax](http://javascriptplayground.com/blog/2015/02/promises/) instead of callbacks.  JSON Schema $Ref Parser allows you to use whichever one you prefer.  Every method accepts an optional callback _and_ returns a Promise.  So pick your poison.


Circular $Refs
--------------------------
JSON Schema files can contain [circular $ref pointers](https://gist.github.com/BigstickCarpet/d18278935fc73e3a0ee1), and JSON Schema $Ref Parser fully supports them. Circular references can be resolved and dereferenced just like any other reference.  However, if you intend to serialize the dereferenced schema as JSON, then you should be aware that [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) does not support circular references by default, so you will need to [use a custom replacer function](https://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json).

You can disable circular references by setting the [`$refs.circular`](#options) option to `false`. Then, if a circular reference is found, a `ReferenceError` will be thrown.

Another option is to use the [`bundle`](#bundleschema-options-callback) method rather than the [`dereference`](#dereferenceschema-options-callback) method.  Bundling does _not_ result in circular references, because it simply converts _external_ `$ref` pointers to _internal_ ones.

```javascript
"person": {
    "properties": {
        "name": {
          "type": "string"
        },
        "spouse": {
          "type": {
            "$ref": "#/person"        // circular reference
          }
        }
    }
}
```


Contributing
--------------------------
I welcome any contributions, enhancements, and bug-fixes.  [File an issue](https://github.com/BigstickCarpet/json-schema-ref-parser/issues) on GitHub and [submit a pull request](https://github.com/BigstickCarpet/json-schema-ref-parser/pulls).

#### Building/Testing
To build/test the project locally on your computer:

1. __Clone this repo__<br>
`git clone https://github.com/bigstickcarpet/json-schema-ref-parser.git`

2. __Install dependencies__<br>
`npm install`

3. __Run the build script__<br>
`npm run build`

4. __Run the unit tests__<br>
`npm run mocha` (test in Node)<br>
`npm run karma` (test in web browsers)<br>
`npm test` (test in Node and browsers, and report code coverage)


License
--------------------------
JSON Schema $Ref Parser is 100% free and open-source, under the [MIT license](LICENSE). Use it however you want.
