# Change Log
All notable changes will be documented in this file.
JSON Schema $Ref Parser adheres to [Semantic Versioning](http://semver.org/).


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
