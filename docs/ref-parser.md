# The $RefParser class

This is the default export of JSON Schema $Ref Parser. You can creates instances of this class using `new $RefParser()`, or you can just call its [static methods](README.md#class-methods-vs-instance-methods).

##### Properties

- [`schema`](#schema)
- [`$refs`](#refs)

##### Methods

- [`dereference()`](#dereferenceschema-options-callback)
- [`bundle()`](#bundleschema-options-callback)
- [`parse()`](#parseschema-options-callback)
- [`resolve()`](#resolveschema-options-callback)

### `schema`

The `schema` property is the parsed/bundled/dereferenced JSON Schema object. This is the same value that is passed to the callback function (or Promise) when calling the [`parse`](#parseschema-options-callback), [`bundle`](#bundleschema-options-callback), or [`dereference`](#dereferenceschema-options-callback) methods.

```javascript
let parser = new $RefParser();

parser.schema; // => null

let schema = await parser.dereference("my-schema.json");
typeof parser.schema; // => "object"

schema === parser.schema; // => true
```

### `$refs`

The `$refs` property is a [`$Refs`](refs.md) object, which lets you access all of the externally-referenced files in the schema, as well as easily get and set specific values in the schema using JSON pointers.

This is the same value that is passed to the callback function (or Promise) when calling the [`resolve`](#resolveschema-options-callback) method.

```javascript
let parser = new $RefParser();

parser.$refs.paths(); // => [] empty array

await parser.dereference("my-schema.json");
parser.$refs.paths(); // => ["my-schema.json"]
```

### `dereference(schema, [options], [callback])`

- **schema** (_required_) - `string` or `object`<br>
  A JSON Schema object, or the file path or URL of a JSON Schema file. See the [`parse`](#parseschema-options-callback) method for more info.

- **options** (_optional_) - `object`<br>
  See [options](options.md) for the full list of options

- **callback** (_optional_) - `function(err, schema)`<br>
  A callback that will receive the dereferenced schema object

- **Return Value:** `Promise`<br>
  See [Callbacks vs. Promises](README.md#callbacks-vs-promises)

Dereferences all `$ref` pointers in the JSON Schema, replacing each reference with its resolved value. This results in a schema object that does not contain _any_ `$ref` pointers. Instead, it's a normal JavaScript object tree that can easily be crawled and used just like any other JavaScript object. This is great for programmatic usage, especially when using tools that don't understand JSON references.

The `dereference` method maintains object reference equality, meaning that all `$ref` pointers that point to the same object will be replaced with references to the same object. Again, this is great for programmatic usage, but it does introduce the risk of [circular references](README.md#circular-refs), so be careful if you intend to serialize the schema using [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify). Consider using the [`bundle`](#bundleschema-options-callback) method instead, which does not create circular references.

```javascript
let schema = await $RefParser.dereference("my-schema.yaml");

// The `schema` object is a normal JavaScript object,
// so you can easily access any part of the schema using simple dot notation
console.log(schema.definitions.person.properties.firstName); // => {type: "string"}

// Object reference equality works as expected
schema.definitions.thing === schema.definitions.batmobile; // => true
```

### `bundle(schema, [options], [callback])`

- **schema** (_required_) - `string` or `object`<br>
  A JSON Schema object, or the file path or URL of a JSON Schema file. See the [`parse`](#parseschema-options-callback) method for more info.

- **options** (_optional_) - `object`<br>
  See [options](options.md) for the full list of options

- **callback** (_optional_) - `function(err, schema)`<br>
  A callback that will receive the bundled schema object

- **Return Value:** `Promise`<br>
  See [Callbacks vs. Promises](README.md#callbacks-vs-promises)

Bundles all referenced files/URLs into a single schema that only has _internal_ `$ref` pointers. This lets you split-up your schema however you want while you're building it, but easily combine all those files together when it's time to package or distribute the schema to other people. The resulting schema size will be small, since it will still contain _internal_ JSON references rather than being [fully-dereferenced](#dereferenceschema-options-callback).

This also eliminates the risk of [circular references](README.md#circular-refs), so the schema can be safely serialized using [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).

```javascript
let schema = await $RefParser.bundle("my-schema.yaml");
console.log(schema.definitions.person); // => {$ref: "#/definitions/schemas~1people~1Bruce-Wayne.json"}
```

### `parse(schema, [options], [callback])`

- **schema** (_required_) - `string` or `object`<br>
  A JSON Schema object, or the file path or URL of a JSON Schema file.
  <br><br>
  The path can be absolute or relative. In Node, the path is relative to `process.cwd()`. In the browser, it's relative to the URL of the page.

- **options** (_optional_) - `object`<br>
  See [options](options.md) for the full list of options

- **callback** (_optional_) - `function(err, schema)`<br>
  A callback that will receive the parsed schema object, or an error

- **Return Value:** `Promise`<br>
  See [Callbacks vs. Promises](README.md#callbacks-vs-promises)

> This method is used internally by other methods, such as [`bundle`](#bundleschema-options-callback) and [`dereference`](#dereferenceschema-options-callback). You probably won't need to call this method yourself.

Parses the given JSON Schema file (in JSON or YAML format), and returns it as a JavaScript object. This method **does not** resolve `$ref` pointers or dereference anything. It simply parses _one_ file and returns it.

```javascript
let schema = await $RefParser.parse("my-schema.yaml");
console.log(schema.definitions.person); // => {$ref: "schemas/people/Bruce-Wayne.json"}
```

### `resolve(schema, [options], [callback])`

- **path** (_required_) - `string` or `object`<br>
  A JSON Schema object, or the file path or URL of a JSON Schema file. See the [`parse`](#parseschema-options-callback) method for more info.

- **options** (_optional_) - `object`<br>
  See [options](options.md) for the full list of options

- **callback** (_optional_) - `function(err, $refs)`<br>
  A callback that will receive a [`$Refs`](refs.md) object

- **Return Value:** `Promise`<br>
  See [Callbacks vs. Promises](README.md#callbacks-vs-promises)

> This method is used internally by other methods, such as [`bundle`](#bundleschema-options-callback) and [`dereference`](#dereferenceschema-options-callback). You probably won't need to call this method yourself.

Resolves all JSON references (`$ref` pointers) in the given JSON Schema file. If it references any other files/URLs, then they will be downloaded and resolved as well. This method **does not** dereference anything. It simply gives you a [`$Refs`](refs.md) object, which is a map of all the resolved references and their values.

```javascript
let $refs = await $RefParser.resolve("my-schema.yaml");

// $refs.paths() returns the paths of all the files in your schema
let filePaths = $refs.paths();

// $refs.get() lets you query parts of your schema
let name = $refs.get("schemas/people/Bruce-Wayne.json#/properties/name");

// $refs.set() lets you change parts of your schema
$refs.set("schemas/people/Bruce-Wayne.json#/properties/favoriteColor/default", "black");
```
