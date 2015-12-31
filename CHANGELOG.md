# Change Log
All notable changes will be documented in this file.
JSON Schema $Ref Parser adheres to [Semantic Versioning](http://semver.org/).


## [v2.0.0](https://github.com/BigstickCarpet/json-schema-ref-parser/tree/v2.0.0) (2015-12-31)

Bumping the major version number because [this change](https://github.com/BigstickCarpet/json-schema-ref-parser/pull/5) technically breaks backward-compatibility &mdash; although I doubt it will actually affect many people.  Basically, if you're using JSON Schema $Ref Parser to download files from a CORS-enabled server that requires authentication, then you'll need to set the `http.withCredentials` option to `true`.

```javascript
$RefParser.dereference('http://some.server.com/file.json', {
    http: { withCredentials: true }
});
```

[Full Changelog](https://github.com/BigstickCarpet/json-schema-ref-parser/compare/v1.4.1...v2.0.0)
