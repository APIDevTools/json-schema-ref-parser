# The $Refs class

When you call the [`resolve`](ref-parser.md#resolveschema-options-callback) method, the value that gets passed to the callback function (or Promise) is a `$Refs` object. This same object is accessible via the [`parser.$refs`](ref-parser.md#refs) property of `$RefParser` objects.

This object is a map of JSON References and their resolved values. It also has several convenient helper methods that make it easy for you to navigate and manipulate the JSON References.

##### Properties

- [`circular`](#circular)

##### Methods

- [`paths()`](#pathstypes)
- [`values()`](#valuestypes)
- [`exists()`](#existsref)
- [`get()`](#getref)
- [`set()`](#setref-value)

### `circular`

- **Type:** `boolean`

This property is `true` if the schema contains any [circular references](README.md#circular-refs). You may want to check this property before serializing the dereferenced schema as JSON, since [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) does not support circular references by default.

```javascript
let parser = new $RefParser();
await parser.dereference("my-schema.json");

if (parser.$refs.circular) {
  console.log("The schema contains circular references");
}
```

### `paths([types])`

- **types** (_optional_) - `string` (one or more)<br>
  Optionally only return certain types of paths ("file", "http", etc.)

- **Return Value:** `array` of `string`<br>
  Returns the paths/URLs of all the files in your schema (including the main schema file).

```javascript
let $refs = await $RefParser.resolve("my-schema.json");

// Get the paths of ALL files in the schema
$refs.paths();

// Get the paths of local files only
$refs.paths("file");

// Get all URLs
$refs.paths("http");
```

### `values([types])`

- **types** (_optional_) - `string` (one or more)<br>
  Optionally only return values from certain locations ("file", "http", etc.)

- **Return Value:** `object`<br>
  Returns a map of paths/URLs and their correspond values.

```javascript
let $refs = await $RefParser.resolve("my-schema.json");

// Get ALL paths & values in the schema
// (this is the same as $refs.toJSON())
let values = $refs.values();

values["schemas/people/Bruce-Wayne.json"];
values["schemas/places.yaml"];
values["http://wayne-enterprises.com/things/batmobile"];
```

### `exists($ref)`

- **$ref** (_required_) - `string`<br>
  The JSON Reference path, optionally with a JSON Pointer in the hash

- **Return Value:** `boolean`<br>
  Returns `true` if the given path exists in the schema; otherwise, returns `false`

```javascript
let $refs = await $RefParser.resolve("my-schema.json");

$refs.exists("schemas/places.yaml#/definitions/Gotham-City"); // => true
$refs.exists("schemas/places.yaml#/definitions/Metropolis"); // => false
```

### `get($ref)`

- **$ref** (_required_) - `string`<br>
  The JSON Reference path, optionally with a JSON Pointer in the hash

- **Return Value:** `boolean`<br>
  Gets the value at the given path in the schema. Throws an error if the path does not exist.

```javascript
let $refs = await $RefParser.resolve("my-schema.json");
let value = $refs.get("schemas/people/Bruce-Wayne.json#/properties/address");
```

### `set($ref, value)`

- **$ref** (_required_) - `string`<br>
  The JSON Reference path, optionally with a JSON Pointer in the hash

- **value** (_required_)<br>
  The value to assign. Can be anything (object, string, number, etc.)

Sets the value at the given path in the schema. If the property, or any of its parents, don't exist, they will be created.

```javascript
let $refs = await $RefParser.resolve("my-schema.json");
$refs.set("schemas/people/Bruce-Wayne.json#/properties/favoriteColor/default", "black");
```
