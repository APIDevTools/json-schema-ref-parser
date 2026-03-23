# File Info Object

JSON Schema $Ref Parser supports plug-ins, such as [resolvers](resolvers.md) and [parsers](parsers.md). These plug-ins can have methods such as `canRead()`, `read()`, `canParse()`, and `parse()`. All of these methods accept the same object as their parameter: an object containing information about the file being read or parsed.

The file info object currently only consists of a few properties, but it may grow in the future if plug-ins end up needing more information.

| Property    | Type                                                                       | Description                                                                                                                                                                             |
| :---------- | :------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`       | `string`                                                                   | The full URL of the file. This could be any type of URL, including "http://", "https://", "file://", "ftp://", "mongodb://", or even a local filesystem path (when running in Node.js). |
| `reference` | `string`                                                                   | The unresolved `$ref` value exactly as it appeared in the parent schema, without the hash. This is useful for custom resolvers that need the original relative reference.              |
| `baseUrl`   | `string`                                                                   | The URL that `reference` was resolved against to produce `url`. This may include a JSON Pointer fragment when the reference came from a nested location.                              |
| `extension` | `string`                                                                   | The lowercase file extension, such as ".json", ".yaml", ".txt", etc.                                                                                                                    |
| `data`      | `string` [`Buffer`](https://nodejs.org/api/buffer.html#buffer_buffer) etc. | The raw file contents, in whatever form they were returned by the [resolver](resolvers.md) that read the file.                                                                          |
