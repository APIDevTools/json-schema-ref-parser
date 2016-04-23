Custom Resolvers
==========================

JSON Schema $Ref Parser comes with built-in resolvers for HTTP and HTTPS URLs, as well as local filesystem paths (when running in Node.js).  You can add your own custom resolvers to support additional protocols, or even replace any of the built-in resolvers with your own custom implementation.

You can see the source code for any of the built-in resolvers [right here](../../lib/resolvers).

#### Simple Example: Creating your own resolver
The fastest way to learn is by example, so let's do that.  Here's a simplistic resolver that resolves MongoDB URIs:

```javascript
var myResolver = {
  order: 1,

  canResolve: /^mongodb:/i,

  resolve: function(file, callback) {
    MongoClient.connect(file.url, function(err, db) {
      if (err) {
        callback(err);
      }
      else {
        db.find({}).toArray(function(err, document) {
          callback(null, document);
        });
      }
    }
  }
};

$RefParser.dereference(mySchema, { resolve: { mongo: myResolver }});
```

#### The `order` property
All resolvers have an `order` property, even the built-in resolvers.  If you don't specify an `order` property, then your resolver will run last. Specifying `order: 1`, like we did in this example, will make your resolver run first.  Or you can squeeze your resolver in-between some of the built-in resolvers.  For example, `order: 101` would make it run _after_ the file resolver, but _before_ the HTTP resolver.  You can see the order of all the built-in resolvers by looking at [their source code](../../lib/resolvers).

The `order` property and `canResolve` property are related to each other. For each file that JSON Schema $Ref Parser needs to resolve, it first determines which resolvers _can_ resolve that file by checking their `canResolve` property.  If only one resolver matches a file, then _only_ that one resolver is called, regardless of its `order`.  If multiple resolvers match a file, then those resolvers are tried _in order_ until one of them successfully resolves the file. Once a resolver successfully resolves the file, the rest of the resolvers are skipped.


#### The `canResolve` property
The `canResolve` property tells JSON Schema $Ref Parser what kind of URIs your resolver can resolve. In this example, we've simply specified a regular expression that matches "mogodb://" URIs, but we could have used a simple boolean, or even a function with custom logic to determine which files to resolve.  Here are examples of each approach:

```javascript
// Resolve ALL URIs
canResolve: true

// Resolve all URIs on localhost
canResolve: /localhost/i

// A function that returns a truthy/falsy value
canResolve: function(file) {
  return file.url.indexOf("127.0.0.1") !== -1;
}
```

When using the function form, the `file` parameter is a [file info object](file-info-object.md), which contains information about the file being resolved.


#### The `resolve` method
This is where the real work of a resolver happens.  The `resolve` method accepts the same [file info object](file-info-object.md) as the `canResolve` function, but rather than returning a boolean value, the `resolve` method should return the contents of the file.  The file contents should be returned in as raw a form as possible, such as a string or a byte array.  Any further parsing or processing should be done by [parsers](parsers.md).

Unlike the `canResolve` function, the `resolve` method can also be asynchronous. This might be important if your resolver needs to read data from a database or some other external source.  You can return your asynchronous value using either an [ES6 Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or a Node.js-style error-first callback.  Of course, if your resolver has the ability to return its data synchronously, then that's fine too.  Here are examples of all three approaches:

```javascript
// Return the value synchronously
resolve: function(file) {
  return fs.readFileSync(file.url);
}

// Return the value in a callback function
resolve: function(file, callback) {
  doSomethingAsync(file.url, function(data) {
    if (data) {
      // Success !
      callback(null, data);
    }
    else {
      // Error !
      callback(new Error("No data!"));
    }
  });
}

// Return the value in an ES6 Promise
resolve: function(file) {
  doSomethingAsync(file.url)
    .then(function(data) {
      if (data) {
        // Success !
        return data;
      }
      else {
        // Error !
        throw new Error("No data!");
      }
    });
}
```
