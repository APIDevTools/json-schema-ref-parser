import * as assert from "assert";
import * as $RefParser from "../../lib";

const baseUrl = "http://example.com/schema";
const schemaPath = "my-schema.json";
const schemaObject: $RefParser.JSONSchema = { title: "my-schema" };
const options = {};
const promiseResolve = (_: object) => undefined;
const promiseReject = (_: Error) => undefined;
const callback = (_err: Error | null, _schema?: object) => undefined;


// $RefParser class instance
let parser = new $RefParser();


// $RefParser instance properties
assert(parser.$refs.circular === true);
assert(parser.schema.type === "object");


// $RefParser instance methods (with callbacks)
parser.bundle(schemaPath, callback);
parser.bundle(schemaObject, callback);
parser.bundle(schemaPath, options, callback);
parser.bundle(schemaObject, options, callback);
parser.bundle(baseUrl, schemaPath, options, callback);
parser.bundle(baseUrl, schemaObject, options, callback);

parser.dereference(schemaPath, callback);
parser.dereference(schemaObject, callback);
parser.dereference(schemaPath, options, callback);
parser.dereference(schemaObject, options, callback);
parser.dereference(baseUrl, schemaPath, options, callback);
parser.dereference(baseUrl, schemaObject, options, callback);

parser.parse(schemaPath, callback);
parser.parse(schemaObject, callback);
parser.parse(schemaPath, options, callback);
parser.parse(schemaObject, options, callback);
parser.parse(baseUrl, schemaPath, options, callback);
parser.parse(baseUrl, schemaObject, options, callback);

parser.resolve(schemaPath, callback);
parser.resolve(schemaObject, callback);
parser.resolve(schemaPath, options, callback);
parser.resolve(schemaObject, options, callback);
parser.resolve(baseUrl, schemaPath, options, callback);
parser.resolve(baseUrl, schemaObject, options, callback);


// $RefParser instance methods (with Promises)
parser.bundle(schemaPath).then(promiseResolve, promiseReject);
parser.bundle(schemaObject).then(promiseResolve, promiseReject);
parser.bundle(schemaPath, options).then(promiseResolve, promiseReject);
parser.bundle(schemaObject, options).then(promiseResolve, promiseReject);
parser.bundle(baseUrl, schemaPath, options).then(promiseResolve, promiseReject);
parser.bundle(baseUrl, schemaObject, options).then(promiseResolve, promiseReject);

parser.dereference(schemaPath).then(promiseResolve, promiseReject);
parser.dereference(schemaObject).then(promiseResolve, promiseReject);
parser.dereference(schemaPath, options).then(promiseResolve, promiseReject);
parser.dereference(schemaObject, options).then(promiseResolve, promiseReject);
parser.dereference(baseUrl, schemaPath, options).then(promiseResolve, promiseReject);
parser.dereference(baseUrl, schemaObject, options).then(promiseResolve, promiseReject);

parser.parse(schemaPath).then(promiseResolve, promiseReject);
parser.parse(schemaObject).then(promiseResolve, promiseReject);
parser.parse(schemaPath, options).then(promiseResolve, promiseReject);
parser.parse(schemaObject, options).then(promiseResolve, promiseReject);
parser.parse(baseUrl, schemaPath, options).then(promiseResolve, promiseReject);
parser.parse(baseUrl, schemaObject, options).then(promiseResolve, promiseReject);

parser.resolve(schemaPath).then(promiseResolve, promiseReject);
parser.resolve(schemaObject).then(promiseResolve, promiseReject);
parser.resolve(schemaPath, options).then(promiseResolve, promiseReject);
parser.resolve(schemaObject, options).then(promiseResolve, promiseReject);
parser.resolve(baseUrl, schemaPath, options).then(promiseResolve, promiseReject);
parser.resolve(baseUrl, schemaObject, options).then(promiseResolve, promiseReject);


// $RefParser static methods (with callbacks)
$RefParser.bundle(schemaPath, callback);
$RefParser.bundle(schemaObject, callback);
$RefParser.bundle(schemaPath, options, callback);
$RefParser.bundle(schemaObject, options, callback);
$RefParser.bundle(baseUrl, schemaPath, options, callback);
$RefParser.bundle(baseUrl, schemaObject, options, callback);

$RefParser.dereference(schemaPath, callback);
$RefParser.dereference(schemaObject, callback);
$RefParser.dereference(schemaPath, options, callback);
$RefParser.dereference(schemaObject, options, callback);
$RefParser.dereference(baseUrl, schemaPath, options, callback);
$RefParser.dereference(baseUrl, schemaObject, options, callback);

$RefParser.parse(schemaPath, callback);
$RefParser.parse(schemaObject, callback);
$RefParser.parse(schemaPath, options, callback);
$RefParser.parse(schemaObject, options, callback);
$RefParser.parse(baseUrl, schemaPath, options, callback);
$RefParser.parse(baseUrl, schemaObject, options, callback);

$RefParser.resolve(schemaPath, callback);
$RefParser.resolve(schemaObject, callback);
$RefParser.resolve(schemaPath, options, callback);
$RefParser.resolve(schemaObject, options, callback);
$RefParser.resolve(baseUrl, schemaPath, options, callback);
$RefParser.resolve(baseUrl, schemaObject, options, callback);


// $RefParser static methods (with Promises)
$RefParser.bundle(schemaPath).then(promiseResolve, promiseReject);
$RefParser.bundle(schemaObject).then(promiseResolve, promiseReject);
$RefParser.bundle(schemaPath, options).then(promiseResolve, promiseReject);
$RefParser.bundle(schemaObject, options).then(promiseResolve, promiseReject);
$RefParser.bundle(baseUrl, schemaPath, options).then(promiseResolve, promiseReject);
$RefParser.bundle(baseUrl, schemaObject, options).then(promiseResolve, promiseReject);

$RefParser.dereference(schemaPath).then(promiseResolve, promiseReject);
$RefParser.dereference(schemaObject).then(promiseResolve, promiseReject);
$RefParser.dereference(schemaPath, options).then(promiseResolve, promiseReject);
$RefParser.dereference(schemaObject, options).then(promiseResolve, promiseReject);
$RefParser.dereference(baseUrl, schemaPath, options).then(promiseResolve, promiseReject);
$RefParser.dereference(baseUrl, schemaObject, options).then(promiseResolve, promiseReject);

$RefParser.parse(schemaPath).then(promiseResolve, promiseReject);
$RefParser.parse(schemaObject).then(promiseResolve, promiseReject);
$RefParser.parse(schemaPath, options).then(promiseResolve, promiseReject);
$RefParser.parse(schemaObject, options).then(promiseResolve, promiseReject);
$RefParser.parse(baseUrl, schemaPath, options).then(promiseResolve, promiseReject);
$RefParser.parse(baseUrl, schemaObject, options).then(promiseResolve, promiseReject);

$RefParser.resolve(schemaPath).then(promiseResolve, promiseReject);
$RefParser.resolve(schemaObject).then(promiseResolve, promiseReject);
$RefParser.resolve(schemaPath, options).then(promiseResolve, promiseReject);
$RefParser.resolve(schemaObject, options).then(promiseResolve, promiseReject);
$RefParser.resolve(baseUrl, schemaPath, options).then(promiseResolve, promiseReject);
$RefParser.resolve(baseUrl, schemaObject, options).then(promiseResolve, promiseReject);
