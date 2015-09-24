JSON Schema $Ref Parser API
==========================

### [`$RefParser`](ref-parser.md)
- [`schema`](ref-parser.md#schema)
- [`$refs`](ref-parser.md#refs)
- [`dereference()`](ref-parser.md#dereferencepath-options-callback)
- [`bundle()`](ref-parser.md#bundlepath-options-callback)
- [`parse()`](ref-parser.md#parsepath-options-callback)
- [`resolve()`](ref-parser.md#resolvepath-options-callback)

### [`$Refs`](refs.md)
- [`circular`](refs.md#circular)
- [`paths()`](refs.md#pathstypes)
- [`values()`](refs.md#valuestypes)
- [`isExpired()`](refs.md#isexpiredref)
- [`expire()`](refs.md#expireref)
- [`exists()`](refs.md#existsref)
- [`get()`](refs.md#getref-options)
- [`set()`](refs.md#setref-value-options)

### [`YAML`](yaml.md)
- [`parse()`](yaml.md#parsetext)
- [`stringify()`](yaml.md#stringifyvalue)

### [`Options`](options.md)


Topics
---------------------
- [Class methods vs. Instance methods](#class-methods-vs-instance-methods)
- [Callbacks vs. Promises](#callbacks-vs-promises)
- [Circular references](#circular-refs)


### Class methods vs. Instance methods
All of JSON Schema $Ref Parser's methods are available as static (class) methods, and as instance methods.  The static methods simply create a new [`$RefParser`](ref-parser.md) instance and then call the corresponding instance method.  Thus, the following line...

```javascript
$RefParser.resolve("my-schema.json");
```

... is the same as this:

```javascript
var parser = new $RefParser();
parser.resolve("my-schema.json");
```

The difference is that in the second example you now have a reference to `parser`, which means you can access the results ([`parser.schema`](ref-parser.md#schema) and [`parser.$refs`](ref-parser.md#refs)) anytime you want, rather than just in the callback function. Also, having a `$RefParser` instance allows you to benefit from **[caching](options.md#caching)**, so the next time you call [`parser.resolve()`](ref-parser.md#resolveschema-options-callback), it won't need to re-download those files again (as long as the cache hasn't expired).


### Callbacks vs. Promises
Many people prefer [ES6 Promise syntax](http://javascriptplayground.com/blog/2015/02/promises/) instead of callbacks.  JSON Schema $Ref Parser allows you to use whichever one you prefer.  Every method accepts an optional callback _and_ returns a Promise.  So pick your poison.


Circular $Refs
--------------------------
JSON Schema files can contain [circular $ref pointers](https://gist.github.com/BigstickCarpet/d18278935fc73e3a0ee1), and JSON Schema $Ref Parser fully supports them. Circular references can be resolved and dereferenced just like any other reference.  However, if you intend to serialize the dereferenced schema as JSON, then you should be aware that [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) does not support circular references by default, so you will need to [use a custom replacer function](https://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json).

You can disable circular references by setting the [`$refs.circular`](options.md) option to `false`. Then, if a circular reference is found, a `ReferenceError` will be thrown.

Another option is to use the [`bundle`](ref-parser.md#bundleschema-options-callback) method rather than the [`dereference`](ref-parser.md#dereferenceschema-options-callback) method.  Bundling does _not_ result in circular references, because it simply converts _external_ `$ref` pointers to _internal_ ones.

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
