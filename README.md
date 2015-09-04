JSON Schema $Ref Parser
============================
#### Parse, Resolve, and Dereference JSON Schema $ref pointers

[![Build Status](https://api.travis-ci.org/BigstickCarpet/json-schema-ref-parser.svg)](https://travis-ci.org/BigstickCarpet/json-schema-ref-parser)
[![Dependencies](https://david-dm.org/BigstickCarpet/json-schema-ref-parser.svg)](https://david-dm.org/BigstickCarpet/json-schema-ref-parser)
[![Coverage Status](https://coveralls.io/repos/BigstickCarpet/json-schema-ref-parser/badge.svg?branch=master&service=github)](https://coveralls.io/r/BigstickCarpet/json-schema-ref-parser)
[![Code Climate Score](https://codeclimate.com/github/BigstickCarpet/json-schema-ref-parser/badges/gpa.svg)](https://codeclimate.com/github/BigstickCarpet/json-schema-ref-parser)
[![Codacy Score](https://www.codacy.com/project/badge/d8abfe5e9a4044b89bd9f4b999d4a574)](https://www.codacy.com/public/jamesmessinger/json-schema-ref-parser)
[![Inline docs](http://inch-ci.org/github/BigstickCarpet/json-schema-ref-parser.svg?branch=master&style=shields)](http://inch-ci.org/github/BigstickCarpet/json-schema-ref-parser)

[![npm](http://img.shields.io/npm/v/json-schema-ref-parser.svg)](https://www.npmjs.com/package/json-schema-ref-parser)
[![Bower](http://img.shields.io/bower/v/json-schema-ref-parser.svg)](#bower)
[![License](https://img.shields.io/npm/l/json-schema-ref-parser.svg)](LICENSE)

[![Browser Compatibility](https://saucelabs.com/browser-matrix/json-schema-parser.svg)](https://saucelabs.com/u/json-schema-parser)


The Problem:
--------------------------
You've got a JSON Schema with `$ref` pointers to other files and/or URLs.  Maybe you know all the referenced files ahead of time.  Maybe you don't.  Maybe some are local files, and others are remote URLs.  Maybe they are a mix of JSON and YAML format.  Maybe some of the files contain cross-references to each other.

```json
{
    "definitions": {
        "person": {
            "$ref": "schemas/people/Bruce-Wayne.json"
        },
        "place": {
            "$ref": "schemas/places.yaml#/definitions/Gotham-City"
        },
        "thing": {
            "$ref": "http://wayne-enterprises.com/things/batmobile"
        },
        "color": {
            "$ref": "#/definitions/thing/properties/colors/black-as-the-night"
        }
    }
}
```

The Solution:
--------------------------
JSON Schema $Ref Parser is a full [JSON Reference](https://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03) and [JSON Pointer](https://tools.ietf.org/html/rfc6901) implementation that crawls even the most complex [JSON Schemas](http://json-schema.org/latest/json-schema-core.html) and gives you simple, straightforward JavaScript objects.

### Features
* Works in **Node**, **io.js**, and all major **web browsers** on Windows, Mac, and Linux
* Supports **JSON** and **YAML** formats &mdash; even a mix of both!
* Resolves all `$ref` pointers, including pointers to **external files and URLs**
* Configurable **caching** of external files
* Supports [circular references](#circular-refs), nested references, back-references, and cross-references between files
* Can **dereference** your schema, combining everything into a single JavaScript object that's easy to work with
* Different `$ref` pointers to the same value resolve to the same object instance, thus maintaining reference equality
* You can choose to dereference only internal `$refs`, external `$refs`, or both


Installation
--------------------------
Install using **[npm](https://docs.npmjs.com/getting-started/what-is-npm)** or **[bower](http://bower.io/)**, or just download [`ref-parser.js`](dist/ref-parser.js) or [`ref-parser.min.js`](dist/ref-parser.min.js).

#### Node

```bash
npm install json-schema-ref-parser
```

#### Bower

```bash
bower install json-schema-ref-parser
```


Sample Usage
--------------------------

```javascript
//
//
//
// !!! Coming Soon !!!
//
// NOTE: This project is still in alpha.  The API and syntax may change before release
//
//
//
//
```


Circular $Refs
--------------------------
JSON Schema files can contain [circular $ref pointers](https://gist.github.com/BigstickCarpet/d18278935fc73e3a0ee1), and JSON Schema $Ref Parser will detect them and handle them correctly. Circular $ref pointers will be resolved and dereferenced just like any other $ref pointer.  However, this means that the resulting dereferenced JavaScript object will contain circular object references.  This isn't a problem if you just plan to use the object programmatically, but if you attempt to serialize a circular object to JSON, you will receive an error.  Just be aware of that.

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


Contributing
--------------------------
I welcome any contributions, enhancements, and bug-fixes.  [File an issue](https://github.com/BigstickCarpet/json-schema-ref-parser/issues) on GitHub and [submit a pull request](https://github.com/BigstickCarpet/json-schema-ref-parser/pulls).

#### Building/Testing
To build/test the project locally on your computer:

1. __Clone this repo__<br>
`git clone https://github.com/bigstickcarpet/json-schema-ref-parser.git`

2. __Install dependencies__<br>
`npm install`

3. __Run the build script__<br>
`npm run build`

4. __Run the unit tests__<br>
`npm run mocha` (test in Node)<br>
`npm run karma` (test in web browsers)<br>
`npm test` (test in Node and browsers, and report code coverage)


License
--------------------------
JSON Schema $Ref Parser is 100% free and open-source, under the [MIT license](LICENSE). Use it however you want.
