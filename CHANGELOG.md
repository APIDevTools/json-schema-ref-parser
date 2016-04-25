# Change Log
All notable changes will be documented in this file.
JSON Schema $Ref Parser adheres to [Semantic Versioning](http://semver.org/).


## [v4.0.0-beta.1](https://github.com/BigstickCarpet/json-schema-ref-parser/tree/v4.0.0-beta.1) (2016-04-24)

#### Major API Changes
The API has been significantly cleaned up and streamlined.  It (hopefully) makes a lot more sense now, and is easier for newcomers to learn.  There will be a few more beta releases before the final v4.0 release, so if you have any recommendations for improvements to the API, then now's the time to [let me know](https://github.com/BigstickCarpet/json-schema-ref-parser/issues).

I also plan to some significant behind-the-scenes refactoring that shouldn't affect the public API, but will significantly improve the performance and file size when running in a web browser.


#### $RefParser is no longer a class
Previously, `$RefParser` was a class that had both [static and instance methods](https://github.com/BigstickCarpet/json-schema-ref-parser/tree/v3.0.0/docs#class-methods-vs-instance-methods).  Now it's just an object with methods. If you were previously calling the static methods, then the syntax is exactly the same. If you were creating a `$RefParser` instance and then calling the instance methods, then you'll need to switch to the static syntax instead.

The only reason for creating a `$RefParser` instance before was so you could access the [instance properties](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/v3.0.0/docs/ref-parser.md#refparser-class), such as `parser.schema` and `parser.$refs`, but neither of these properties exist anymore. Instead, all methods return a [Schema](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/releases/4.0.0/lib/schema.js.js) object, which gives you access to the same data as before.

#### All methods now return a Schema object
Previously, some methods returned the parsed JSON Schema as a POJO (plain-old javascript object), and other methods returned a [$Refs object](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/v3.0.0/docs/refs.md). Now all methods return a [Schema](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/releases/4.0.0/lib/schema.js.js) object instead.  This is a new object that replaces the old $Refs object and provides even more functionality than before.

```javascript
$RefParser.dereference('http://example.com/my-schema.json')
    .then(function(schema) {
        // `schema.root` is the parsed JSON Schema POJO
        console.log(schema.root.person.properties.firstName);

        // `schema.files` is an array containing all of the files in the schema.
        // Each item in the array is a File object with info about that file.
        schema.files.forEach(function(file) {
            console.log('File URL:', file.url);
            console.log('File contents:', file.data);
        });

        // The first file in the array is always the main schema file
        console.log(schema.files[0].url);       // http://example.com/my-schema.json

        // `schema.rootFile` is a shortcut
        schema.rootFile === schema.files[0];    // true

        // You can easily check whether a file is referenced by the schema.
        // This works with absolute or relative paths
        if (schema.files.exists('person.json')) {
            ...
        }

        // If you know a file is in the array, then you can get it.
        // This works with absolute or relative paths
        var rootFile = schema.files.get('my-schema.json');
        rootFile === schema.rootFile;   // true
    });
```

#### $Refs class removed
The [$Refs](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/v3.0.0/docs/refs.md) class has been removed and replaced with the [Schema](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/releases/4.0.0/lib/schema.js.js) class. The `$refs.paths()` and `$refs.values()` methods have been replaced with the `schema.files` property as shown above.  All other properties and methods of the $Refs class have been moved to the Schema class. Other than that, they have not changed. Here's an example:

```javascript
$RefParser.dereference('http://example.com/my-schema.json')
    .then(function(schema) {
        // You can get any value in the schema using a JSON Pointer string
        var firstName = schema.get('#/person/properties/firstName');

        // You can also set any value in the schema using a JSON Pointer string.
        // Any parts of the path that don't exist will be created.
        schema.set('#/person/properties/firstName/default', 'John Doe');

        // You can check for the existence of a value
        if (schema.exists('#/person/properties/firstName')) {
            ...
        }

        // You can check whether the schema contains any circular references
        if (schema.circular) {
            ...
        }
    });
```

#### YAML object removed
The `$RefParser.YAML` object has been removed. Previously, this object allowed you to use `YAML.parse()` to parse YAML strings into objects and then pass those objects to any of the JSON Schema $Ref Parser methods.  But now all of the methods allow you to simply pass-in a YAML string instead.

#### Resolvers are now readers
Version 3.0 introduced the ability to create your own [resolver plug-ins](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/v3.0.0/docs/plugins/resolvers.md). But really, those plug-ins were for _reading_ files, not resolving them. So "resolvers" have now been renamed "readers", and they have moved to a new `read` option. This also means that the built-in readers (`resolve.file` and `resolve.http`) have moved to `read.file` and `read.http`.

[Full Changelog](https://github.com/BigstickCarpet/json-schema-ref-parser/compare/v3.0.0...v4.0.0-beta.1)


## [v3.0.0](https://github.com/BigstickCarpet/json-schema-ref-parser/tree/v3.0.0) (2016-04-03)

#### Plug-ins !!!
That's the major new feature in this version. Originally requested in [PR #8](https://github.com/BigstickCarpet/json-schema-ref-parser/pull/8), and refined a few times over the past few months, the plug-in API is now finalized and ready to use. You can now define your own [resolvers](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/v3.0.0/docs/plugins/resolvers.md) and [parsers](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/v3.0.0/docs/plugins/parsers.md).

#### Breaking Changes
- The available [options have changed](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/v3.0.0/docs/options.md), mostly due to the new plug-in API.  There's not a one-to-one mapping of old options to new options, so you'll have to read the docs and determine which options you need to set. If any. The out-of-the-box configuration works for most people.

- All of the [caching options have been removed](https://github.com/BigstickCarpet/json-schema-ref-parser/commit/1f4260184bfd370e9cd385b523fb08c098fac6db). Instead, all files are now cached, and the entire cache is reset for each new parse operation. Caching options may come back in a future release, if there is enough demand for it. If you used the old caching options, please open an issue and explain your use-case and requirements.  I need a better understanding of what caching functionality is actually needed by users.

#### Bug Fixes
Lots of little bug fixes.  The only major bug fix is to [support root-level `$ref`s](https://github.com/BigstickCarpet/json-schema-ref-parser/issues/16)


[Full Changelog](https://github.com/BigstickCarpet/json-schema-ref-parser/compare/v2.2.0...v3.0.0)


## [v2.2.0](https://github.com/BigstickCarpet/json-schema-ref-parser/tree/v2.2.0) (2016-01-03)

This version includes a **complete rewrite** of the [`bundle` method](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/master/docs/ref-parser.md#bundleschema-options-callback) method, mostly to fix [this bug](https://github.com/BigstickCarpet/swagger-parser/issues/16), but also to address a few [edge-cases](https://github.com/BigstickCarpet/json-schema-ref-parser/commit/ca9b322879519e4bcb2dcf6e63f08ac254b90868) that weren't handled before.  As a side-effect of this rewrite, there was also some pretty significant refactoring and code-cleanup done throughout the codebase.

Despite the significant code changes, there were no changes to any public-facing APIs, and [all tests are passing](http://bigstickcarpet.com/json-schema-ref-parser/test/index.html) as expected.

[Full Changelog](https://github.com/BigstickCarpet/json-schema-ref-parser/compare/v2.1.0...v2.2.0)


## [v2.1.0](https://github.com/BigstickCarpet/json-schema-ref-parser/tree/v2.1.0) (2015-12-31)

JSON Schema $Ref Parser now automatically follows HTTP redirects. This is especially great for servers that automatically "ugrade" your connection from HTTP to HTTPS via a 301 redirect. Now that won't break your code.

There are a few [new options](https://github.com/BigstickCarpet/json-schema-ref-parser/blob/master/docs/options.md) that allow you to set the number of redirects (default is 5) and a few other HTTP request properties.

[Full Changelog](https://github.com/BigstickCarpet/json-schema-ref-parser/compare/v2.0.0...v2.1.0)


## [v2.0.0](https://github.com/BigstickCarpet/json-schema-ref-parser/tree/v2.0.0) (2015-12-31)

Bumping the major version number because [this change](https://github.com/BigstickCarpet/json-schema-ref-parser/pull/5) technically breaks backward-compatibility &mdash; although I doubt it will actually affect many people.  Basically, if you're using JSON Schema $Ref Parser to download files from a CORS-enabled server that requires authentication, then you'll need to set the `http.withCredentials` option to `true`.

```javascript
$RefParser.dereference('http://some.server.com/file.json', {
    http: { withCredentials: true }
});
```

[Full Changelog](https://github.com/BigstickCarpet/json-schema-ref-parser/compare/v1.4.1...v2.0.0)
