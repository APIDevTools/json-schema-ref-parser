JSON Schema $Ref Parser API
==========================

Things to Know
---------------------
- [Class methods vs. Instance methods](#class-methods-vs-instance-methods)
- [Callbacks vs. Promises](#callbacks-vs-promises)
- [Circular references](#circular-refs)


Classes & Methods
---------------------

#### [The `$RefParser` class](ref-parser.md)
- [`schema` property](ref-parser.md#schema)
- [`$refs` property](ref-parser.md#refs)
- [`dereference()` method](ref-parser.md#dereferenceschema-options-callback)
- [`bundle()` method](ref-parser.md#bundleschema-options-callback)
- [`parse()` method](ref-parser.md#parseschema-options-callback)
- [`resolve()` method](ref-parser.md#resolveschema-options-callback)

#### [The `$Refs` class](refs.md)
- [`circular` property](refs.md#circular)
- [`paths()` method](refs.md#pathstypes)
- [`values()` method](refs.md#valuestypes)
- [`exists()` method](refs.md#existsref)
- [`get()` method](refs.md#getref-options)
- [`set()` method](refs.md#setref-value-options)

#### [The `Options` object](options.md)


### Class methods vs. Instance methods
All of JSON Schema $Ref Parser's methods are available as static (class) methods, and as instance methods.  The static methods simply create a new [`$RefParser`](ref-parser.md) instance and then call the corresponding instance method.  Thus, the following line...

```javascript
$RefParser.bundle("my-schema.json");
```

... is the same as this:

```javascript
let parser = new $RefParser();
parser.bundle("my-schema.json");
```

The difference is that in the second example you now have a reference to `parser`, which means you can access the results ([`parser.schema`](ref-parser.md#schema) and [`parser.$refs`](ref-parser.md#refs)) anytime you want, rather than just in the callback function.


### Callbacks vs. Promises
Many people prefer [Promise syntax](http://javascriptplayground.com/blog/2015/02/promises/) or `async`/`await` instead of callbacks.  JSON Schema $Ref Parser allows you to use whichever one you prefer.

If you pass a callback function to any method, then the method will call the callback using the Node.js error-first convention.  If you do _not_ pass a callback function, then the method will return a Promise.

The following two examples are equivalent:

```javascript
// Callback syntax
$RefParser.dereference(mySchema, (err, api) => {
    if (err) {
        // Error
    }
    else {
        // Success
    }
});
```

```javascript
try {
    // async/await syntax
    let api = await $RefParser.dereference(mySchema);

    // Success
}
catch (err) {
    // Error
}
```


### Circular $Refs
JSON Schema files can contain [circular $ref pointers](https://gist.github.com/JamesMessinger/d18278935fc73e3a0ee1), and JSON Schema $Ref Parser fully supports them. Circular references can be resolved and dereferenced just like any other reference.  However, if you intend to serialize the dereferenced schema as JSON, then you should be aware that [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) does not support circular references by default, so you will need to [use a custom replacer function](https://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json).

You can disable circular references by setting the [`dereference.circular`](options.md) option to `false`. Then, if a circular reference is found, a `ReferenceError` will be thrown.

Or you can choose to just ignore circular references altogether by setting the [`dereference.circular`](options.md) option to `"ignore"`.  In this case, all non-circular references will still be dereferenced as normal, but any circular references will remain in the schema.

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
