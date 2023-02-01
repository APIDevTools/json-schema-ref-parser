import $Refs from "./refs.js";
import _parse from "./parse.js";
import normalizeArgs from "./normalize-args.js";
import resolveExternal from "./resolve-external.js";
import _bundle from "./bundle.js";
import _dereference from "./dereference.js";
import * as url from "./util/url.js";
import {
  JSONParserError,
  InvalidPointerError,
  MissingPointerError,
  ResolverError,
  ParserError,
  UnmatchedParserError,
  UnmatchedResolverError,
  isHandledError,
  JSONParserErrorGroup,
} from "./util/errors.js";
import { ono } from "@jsdevtools/ono";
import maybe from "./util/maybe.js";
import type { ParserOptions } from "./options.js";
import type { $RefsCallback, JSONSchema, SchemaCallback } from "./types/index.js";

export { JSONParserError };
export { InvalidPointerError };
export { MissingPointerError };
export { ResolverError };
export { ParserError };
export { UnmatchedParserError };
export { UnmatchedResolverError };

type RefParserSchema = string | JSONSchema;

/**
 * This class parses a JSON schema, builds a map of its JSON references and their resolved values,
 * and provides methods for traversing, manipulating, and dereferencing those references.
 *
 * @class
 */
export class $RefParser {
  /**
   * The parsed (and possibly dereferenced) JSON schema object
   *
   * @type {object}
   * @readonly
   */
  public schema: JSONSchema | null = null;

  /**
   * The resolved JSON references
   *
   * @type {$Refs}
   * @readonly
   */
  $refs = new $Refs();

  /**
   * Parses the given JSON schema.
   * This method does not resolve any JSON references.
   * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
   *
   * @param [path] - The file path or URL of the JSON schema
   * @param [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param [options] - Options that determine how the schema is parsed
   * @param [callback] - An error-first callback. The second parameter is the parsed JSON schema object.
   * @returns - The returned promise resolves with the parsed JSON schema object.
   */
  public parse(schema: RefParserSchema): Promise<JSONSchema>;
  public parse(schema: RefParserSchema, callback: SchemaCallback): Promise<void>;
  public parse(schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public parse(schema: RefParserSchema, options: ParserOptions, callback: SchemaCallback): Promise<void>;
  public parse(baseUrl: string, schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public parse(
    baseUrl: string,
    schema: RefParserSchema,
    options: ParserOptions,
    callback: SchemaCallback,
  ): Promise<void>;

  async parse() {
    const args = normalizeArgs(arguments as any);
    let promise;

    if (!args.path && !args.schema) {
      const err = ono(`Expected a file path, URL, or object. Got ${args.path || args.schema}`);
      return maybe(args.callback, Promise.reject(err));
    }

    // Reset everything
    this.schema = null;
    this.$refs = new $Refs();

    // If the path is a filesystem path, then convert it to a URL.
    // NOTE: According to the JSON Reference spec, these should already be URLs,
    // but, in practice, many people use local filesystem paths instead.
    // So we're being generous here and doing the conversion automatically.
    // This is not intended to be a 100% bulletproof solution.
    // If it doesn't work for your use-case, then use a URL instead.
    let pathType = "http";
    if (url.isFileSystemPath(args.path)) {
      args.path = url.fromFileSystemPath(args.path);
      pathType = "file";
    }

    // Resolve the absolute path of the schema
    args.path = url.resolve(url.cwd(), args.path);

    if (args.schema && typeof args.schema === "object") {
      // A schema object was passed-in.
      // So immediately add a new $Ref with the schema object as its value
      const $ref = this.$refs._add(args.path);
      $ref.value = args.schema;
      $ref.pathType = pathType;
      promise = Promise.resolve(args.schema);
    } else {
      // Parse the schema file/url
      promise = _parse(args.path, this.$refs, args.options);
    }

    try {
      const result = await promise;

      if (result !== null && typeof result === "object" && !Buffer.isBuffer(result)) {
        this.schema = result;
        return maybe(args.callback, Promise.resolve(this.schema!));
      } else if (args.options.continueOnError) {
        this.schema = null; // it's already set to null at line 79, but let's set it again for the sake of readability
        return maybe(args.callback, Promise.resolve(this.schema!));
      } else {
        throw ono.syntax(`"${this.$refs._root$Ref.path || result}" is not a valid JSON Schema`);
      }
    } catch (err) {
      if (!args.options.continueOnError || !isHandledError(err)) {
        return maybe(args.callback, Promise.reject(err));
      }

      if (this.$refs._$refs[url.stripHash(args.path)]) {
        this.$refs._$refs[url.stripHash(args.path)].addError(err);
      }

      return maybe(args.callback, Promise.resolve(null));
    }
  }

  public static parse(schema: RefParserSchema): Promise<JSONSchema>;
  public static parse(schema: RefParserSchema, callback: SchemaCallback): Promise<void>;
  public static parse(schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public static parse(schema: RefParserSchema, options: ParserOptions, callback: SchemaCallback): Promise<void>;
  public static parse(baseUrl: string, schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public static parse(
    baseUrl: string,
    schema: RefParserSchema,
    options: ParserOptions,
    callback: SchemaCallback,
  ): Promise<void>;
  public static parse(): Promise<JSONSchema> | Promise<void> {
    const parser = new $RefParser();
    return parser.parse.apply(parser, arguments as any);
  }

  /**
   * *This method is used internally by other methods, such as `bundle` and `dereference`. You probably won't need to call this method yourself.*
   *
   * Resolves all JSON references (`$ref` pointers) in the given JSON Schema file. If it references any other files/URLs, then they will be downloaded and resolved as well. This method **does not** dereference anything. It simply gives you a `$Refs` object, which is a map of all the resolved references and their values.
   *
   * See https://apitools.dev/json-schema-ref-parser/docs/ref-parser.html#resolveschema-options-callback
   *
   * @param schema A JSON Schema object, or the file path or URL of a JSON Schema file. See the `parse` method for more info.
   * @param options (optional)
   * @param callback (optional) A callback that will receive a `$Refs` object
   */
  public resolve(schema: RefParserSchema): Promise<$Refs>;
  public resolve(schema: RefParserSchema, callback: $RefsCallback): Promise<void>;
  public resolve(schema: RefParserSchema, options: ParserOptions): Promise<$Refs>;
  public resolve(schema: RefParserSchema, options: ParserOptions, callback: $RefsCallback): Promise<void>;
  public resolve(baseUrl: string, schema: RefParserSchema, options: ParserOptions): Promise<$Refs>;
  public resolve(
    baseUrl: string,
    schema: RefParserSchema,
    options: ParserOptions,
    callback: $RefsCallback,
  ): Promise<void>;
  /**
   * Parses the given JSON schema and resolves any JSON references, including references in
   * externally-referenced files.
   *
   * @param [path] - The file path or URL of the JSON schema
   * @param [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param [options] - Options that determine how the schema is parsed and resolved
   * @param [callback]
   * - An error-first callback. The second parameter is a {@link $Refs} object containing the resolved JSON references
   *
   * @returns
   * The returned promise resolves with a {@link $Refs} object containing the resolved JSON references
   */
  async resolve() {
    const args = normalizeArgs(arguments);

    try {
      await this.parse(args.path, args.schema, args.options);
      await resolveExternal(this, args.options);
      finalize(this);
      return maybe(args.callback, Promise.resolve(this.$refs));
    } catch (err) {
      return maybe(args.callback, Promise.reject(err));
    }
  }

  /**
   * *This method is used internally by other methods, such as `bundle` and `dereference`. You probably won't need to call this method yourself.*
   *
   * Resolves all JSON references (`$ref` pointers) in the given JSON Schema file. If it references any other files/URLs, then they will be downloaded and resolved as well. This method **does not** dereference anything. It simply gives you a `$Refs` object, which is a map of all the resolved references and their values.
   *
   * See https://apitools.dev/json-schema-ref-parser/docs/ref-parser.html#resolveschema-options-callback
   *
   * @param schema A JSON Schema object, or the file path or URL of a JSON Schema file. See the `parse` method for more info.
   * @param options (optional)
   * @param callback (optional) A callback that will receive a `$Refs` object
   */
  public static resolve(schema: RefParserSchema): Promise<$Refs>;
  public static resolve(schema: RefParserSchema, callback: $RefsCallback): Promise<void>;
  public static resolve(schema: RefParserSchema, options: ParserOptions): Promise<$Refs>;
  public static resolve(schema: RefParserSchema, options: ParserOptions, callback: $RefsCallback): Promise<void>;
  public static resolve(baseUrl: string, schema: RefParserSchema, options: ParserOptions): Promise<$Refs>;
  public static resolve(
    baseUrl: string,
    schema: RefParserSchema,
    options: ParserOptions,
    callback: $RefsCallback,
  ): Promise<void>;
  static resolve(): Promise<JSONSchema> | Promise<void> {
    const instance = new $RefParser();
    return instance.resolve.apply(instance, arguments as any);
  }

  /**
   * Parses the given JSON schema, resolves any JSON references, and bundles all external references
   * into the main JSON schema. This produces a JSON schema that only has *internal* references,
   * not any *external* references.
   *
   * @param [path] - The file path or URL of the JSON schema
   * @param [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param [options] - Options that determine how the schema is parsed, resolved, and dereferenced
   * @param [callback] - An error-first callback. The second parameter is the bundled JSON schema object
   * @returns - The returned promise resolves with the bundled JSON schema object.
   */
  /**
   * Bundles all referenced files/URLs into a single schema that only has internal `$ref` pointers. This lets you split-up your schema however you want while you're building it, but easily combine all those files together when it's time to package or distribute the schema to other people. The resulting schema size will be small, since it will still contain internal JSON references rather than being fully-dereferenced.
   *
   * This also eliminates the risk of circular references, so the schema can be safely serialized using `JSON.stringify()`.
   *
   * See https://apitools.dev/json-schema-ref-parser/docs/ref-parser.html#bundleschema-options-callback
   *
   * @param schema A JSON Schema object, or the file path or URL of a JSON Schema file. See the `parse` method for more info.
   * @param options (optional)
   * @param callback (optional) A callback that will receive the bundled schema object
   */
  public static bundle(schema: RefParserSchema): Promise<JSONSchema>;
  public static bundle(schema: RefParserSchema, callback: SchemaCallback): Promise<void>;
  public static bundle(schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public static bundle(schema: RefParserSchema, options: ParserOptions, callback: SchemaCallback): Promise<void>;
  public static bundle(baseUrl: string, schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public static bundle(
    baseUrl: string,
    schema: RefParserSchema,
    options: ParserOptions,
    callback: SchemaCallback,
  ): Promise<JSONSchema>;
  static bundle(): Promise<JSONSchema> | Promise<void> {
    const instance = new $RefParser();
    return instance.bundle.apply(instance, arguments as any);
  }

  /**
   * Parses the given JSON schema, resolves any JSON references, and bundles all external references
   * into the main JSON schema. This produces a JSON schema that only has *internal* references,
   * not any *external* references.
   *
   * @param [path] - The file path or URL of the JSON schema
   * @param [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param [options] - Options that determine how the schema is parsed, resolved, and dereferenced
   * @param [callback] - An error-first callback. The second parameter is the bundled JSON schema object
   * @returns - The returned promise resolves with the bundled JSON schema object.
   */
  /**
   * Bundles all referenced files/URLs into a single schema that only has internal `$ref` pointers. This lets you split-up your schema however you want while you're building it, but easily combine all those files together when it's time to package or distribute the schema to other people. The resulting schema size will be small, since it will still contain internal JSON references rather than being fully-dereferenced.
   *
   * This also eliminates the risk of circular references, so the schema can be safely serialized using `JSON.stringify()`.
   *
   * See https://apitools.dev/json-schema-ref-parser/docs/ref-parser.html#bundleschema-options-callback
   *
   * @param schema A JSON Schema object, or the file path or URL of a JSON Schema file. See the `parse` method for more info.
   * @param options (optional)
   * @param callback (optional) A callback that will receive the bundled schema object
   */
  public bundle(schema: RefParserSchema): Promise<JSONSchema>;
  public bundle(schema: RefParserSchema, callback: SchemaCallback): Promise<void>;
  public bundle(schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public bundle(schema: RefParserSchema, options: ParserOptions, callback: SchemaCallback): Promise<void>;
  public bundle(baseUrl: string, schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public bundle(
    baseUrl: string,
    schema: RefParserSchema,
    options: ParserOptions,
    callback: SchemaCallback,
  ): Promise<void>;
  async bundle() {
    const args = normalizeArgs(arguments);
    try {
      await this.resolve(args.path, args.schema, args.options);
      _bundle(this, args.options);
      finalize(this);
      return maybe(args.callback, Promise.resolve(this.schema!));
    } catch (err) {
      return maybe(args.callback, Promise.reject(err));
    }
  }

  /**
   * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
   * That is, all JSON references are replaced with their resolved values.
   *
   * @param [path] - The file path or URL of the JSON schema
   * @param [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param [options] - Options that determine how the schema is parsed, resolved, and dereferenced
   * @param [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
   * @returns - The returned promise resolves with the dereferenced JSON schema object.
   */
  /**
   * Dereferences all `$ref` pointers in the JSON Schema, replacing each reference with its resolved value. This results in a schema object that does not contain any `$ref` pointers. Instead, it's a normal JavaScript object tree that can easily be crawled and used just like any other JavaScript object. This is great for programmatic usage, especially when using tools that don't understand JSON references.
   *
   * The dereference method maintains object reference equality, meaning that all `$ref` pointers that point to the same object will be replaced with references to the same object. Again, this is great for programmatic usage, but it does introduce the risk of circular references, so be careful if you intend to serialize the schema using `JSON.stringify()`. Consider using the bundle method instead, which does not create circular references.
   *
   * See https://apitools.dev/json-schema-ref-parser/docs/ref-parser.html#dereferenceschema-options-callback
   *
   * @param schema A JSON Schema object, or the file path or URL of a JSON Schema file. See the `parse` method for more info.
   * @param options (optional)
   * @param callback (optional) A callback that will receive the dereferenced schema object
   */
  public static dereference(schema: RefParserSchema): Promise<JSONSchema>;
  public static dereference(schema: RefParserSchema, callback: SchemaCallback): Promise<void>;
  public static dereference(schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public static dereference(schema: RefParserSchema, options: ParserOptions, callback: SchemaCallback): Promise<void>;
  public static dereference(baseUrl: string, schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public static dereference(
    baseUrl: string,
    schema: RefParserSchema,
    options: ParserOptions,
    callback: SchemaCallback,
  ): Promise<void>;
  static dereference(): Promise<JSONSchema> | Promise<void> {
    const instance = new $RefParser();
    return instance.dereference.apply(instance, arguments as any);
  }

  /**
   * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
   * That is, all JSON references are replaced with their resolved values.
   *
   * @param [path] - The file path or URL of the JSON schema
   * @param [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param [options] - Options that determine how the schema is parsed, resolved, and dereferenced
   * @param [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
   * @returns - The returned promise resolves with the dereferenced JSON schema object.
   */
  /**
   * Dereferences all `$ref` pointers in the JSON Schema, replacing each reference with its resolved value. This results in a schema object that does not contain any `$ref` pointers. Instead, it's a normal JavaScript object tree that can easily be crawled and used just like any other JavaScript object. This is great for programmatic usage, especially when using tools that don't understand JSON references.
   *
   * The dereference method maintains object reference equality, meaning that all `$ref` pointers that point to the same object will be replaced with references to the same object. Again, this is great for programmatic usage, but it does introduce the risk of circular references, so be careful if you intend to serialize the schema using `JSON.stringify()`. Consider using the bundle method instead, which does not create circular references.
   *
   * See https://apitools.dev/json-schema-ref-parser/docs/ref-parser.html#dereferenceschema-options-callback
   *
   * @param schema A JSON Schema object, or the file path or URL of a JSON Schema file. See the `parse` method for more info.
   * @param options (optional)
   * @param callback (optional) A callback that will receive the dereferenced schema object
   */
  public dereference(
    baseUrl: string,
    schema: RefParserSchema,
    options: ParserOptions,
    callback: SchemaCallback,
  ): Promise<void>;
  public dereference(schema: RefParserSchema, options: ParserOptions, callback: SchemaCallback): Promise<void>;
  public dereference(schema: RefParserSchema, callback: SchemaCallback): Promise<void>;
  public dereference(baseUrl: string, schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public dereference(schema: RefParserSchema, options: ParserOptions): Promise<JSONSchema>;
  public dereference(schema: RefParserSchema): Promise<JSONSchema>;
  async dereference() {
    const args = normalizeArgs(arguments);

    try {
      await this.resolve(args.path, args.schema, args.options);
      _dereference(this, args.options);
      finalize(this);
      return maybe(args.callback, Promise.resolve(this.schema));
    } catch (err) {
      return maybe(args.callback, Promise.reject(err));
    }
  }
}
export default $RefParser;

function finalize(parser: any) {
  const errors = JSONParserErrorGroup.getParserErrors(parser);
  if (errors.length > 0) {
    throw new JSONParserErrorGroup(parser);
  }
}

export const parse = $RefParser.parse;
export const resolve = $RefParser.resolve;
export const bundle = $RefParser.bundle;
export const dereference = $RefParser.dereference;
