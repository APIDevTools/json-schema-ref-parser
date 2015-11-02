Options
==========================

All [`$RefParser`](ref-parser.md) methods accept an optional `options` parameter, which you can use to customize how the JSON Schema is parsed, resolved, dereferenced, etc.

If you pass an options parameter, you _don't_ need to specify _every_ option.  Any options you don't specify will use their default values, as shown below.

```javascript
$RefParser.dereference("my-schema.yaml", {
    allow: {
        json: false,        // Don't allow JSON files
        empty: false        // Don't allow empty files
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
|`$refs.internal` |bool     |true      |Determines whether internal `$ref` pointers (such as `#/definitions/widget`) will be dereferenced when calling [`dereference()`](ref-parser.md#dereferenceschema-options-callback).  Either way, you'll still be able to get the value using [`$Refs.get()`](refs.md#getref-options)
|`$refs.external` |bool     |true      |Determines whether external `$ref` pointers get resolved/dereferenced. If `false`, then no files/URLs will be retrieved.  Use this if you only want to allow single-file schemas.
|`$refs.circular` |bool or "ignore"     |true      |Determines whether [circular `$ref` pointers](README.md#circular-refs) are allowed. If `false`, then a `ReferenceError` will be thrown if the schema contains a circular reference.<br><br> If set to `"ignore"`, then circular references will _not_ be dereferenced, even when calling [`dereference()`](ref-parser.md#dereferenceschema-options-callback). No error will be thrown, but the [`$Refs.circular`](refs.md#circular) property will still be set to `true`.
|`cache.fs`       |number   |60        |<a name="caching"></a>The length of time (in seconds) to cache local files.  The default is one minute.  Setting to zero will cache forever.
|`cache.http`     |number   |300       |The length of time (in seconds) to cache HTTP URLs.  The default is five minutes.  Setting to zero will cache forever.
|`cache.https`    |number   |300       |The length of time (in seconds) to cache HTTPS URLs.  The default is five minutes.  Setting to zero will cache forever.
|`http.withCredentials`    |bool   |true       |When used in browser specifies `withCredentials` option of `XMLHttpRequest` object. Setting to `false` allows loading via CORS with `Access-Control-Allow-Origin` set to `*`
