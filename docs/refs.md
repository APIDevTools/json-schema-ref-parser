`$Refs` class
==========================

When you call the [`resolve`](ref-parser.md#resolveschema-options-callback) method, the value that gets passed to the callback function (or Promise) is a `$Refs` object.  This same object is accessible via the [`parser.$refs`](ref-parser.md#refs) property of `$RefParser` objects.

This object is a map of JSON References and their resolved values.  It also has several convenient helper methods that make it easy for you to navigate and manipulate the JSON References.


##### Properties
- [`circular`](refs.md#circular)

##### Methods
- [`paths()`](refs.md#pathstypes)
- [`values()`](refs.md#valuestypes)
- [`isExpired()`](refs.md#isexpiredref)
- [`expire()`](refs.md#expireref)
- [`exists()`](refs.md#existsref)
- [`get()`](refs.md#getref-options)
- [`set()`](refs.md#setref-value-options)


### `circular`

- **Type:** `boolean`

This property is `true` if the schema contains any [circular references](README.md#circular-refs).  You may want to check this property before serializing the dereferenced schema as JSON, since [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) does not support circular references by default.

```javascript
var parser = new $RefParser();
parser.dereference("my-schema.json")
  .then(function() {
    if (parser.$refs.circular) {
      console.log('The schema contains circular references');
    }
  });
```


### `paths([types])`

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

### `values([types])`

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


### `isExpired($ref)`

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


### `expire($ref)`

- **$ref** (_required_) - `string`<br>
The JSON Reference path, optionally with a JSON Pointer in the hash

Immediately expires the given JSON reference, so the next time you call a method such as [`parse`](ref-parser.md#parseschema-options-callback) or [`dereference`](ref-parser.md#dereferenceschema-options-callback), the file will be refreshed rather than reusing the cached value.

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    $refs.isExpired("schemas/places.yaml");   // => false

    $refs.expire("schemas/places.yaml");

    $refs.isExpired("schemas/places.yaml");   // => true
  });
```


### `exists($ref)`

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


### `get($ref, [options])`

- **$ref** (_required_) - `string`<br>
The JSON Reference path, optionally with a JSON Pointer in the hash

- **options** (_optional_) - `object`<br>
See [options](options.md) for the full list of options

- **Return Value:** `boolean`<br>
Gets the value at the given path in the schema. Throws an error if the path does not exist.

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    var value = $refs.get("schemas/people/Bruce-Wayne.json#/properties/address");
  });
```


### `set($ref, value, [options])`

- **$ref** (_required_) - `string`<br>
The JSON Reference path, optionally with a JSON Pointer in the hash

- **value** (_required_)<br>
The value to assign. Can be anything (object, string, number, etc.)

- **options** (_optional_) - `object`<br>
See [options](options.md) for the full list of options

Sets the value at the given path in the schema. If the property, or any of its parents, don't exist, they will be created.

```javascript
$RefParser.resolve("my-schema.json")
  .then(function($refs) {
    $refs.set("schemas/people/Bruce-Wayne.json#/properties/favoriteColor/default", "black");
  });
```


