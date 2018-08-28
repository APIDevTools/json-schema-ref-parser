import { normalizeArgs } from './normalize-args'
import $RefParserOptions from './options'
import $Refs from './refs'
import parse from './parse'
import resolveExternal from './resolve-external'
import bundle from './bundle'
import dereference from './dereference'
import { isFileSystemPath, cwd, resolve, fromFileSystemPath } from './util/url'
import maybe = require('call-me-maybe')
import * as ono from 'ono'
import { Schema } from './types'
import YAML from './util/yaml'

type Callback = (err: any, data: any) => void

/**
 * This class parses a JSON schema, builds a map of its JSON references and their resolved values,
 * and provides methods for traversing, manipulating, and dereferencing those references.
 */
class $RefParser {
  /**
   * The parsed (and possibly dereferenced) JSON schema object
   *
   * @type {object}
   * @readonly
   */
  schema: Schema | null = null

  /**
   * The resolved JSON references
   *
   * @type {$Refs}
   * @readonly
   */
  $refs: $Refs = new $Refs()

  /**
   * Parses the given JSON schema.
   * This method does not resolve any JSON references.
   * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
   *
   * @param {string} [path] - The file path or URL of the JSON schema
   * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed
   * @param {function} [callback] - An error-first callback. The second parameter is the parsed JSON schema object.
   * @returns {Promise} - The returned promise resolves with the parsed JSON schema object.
   */
  static parse(
    path: string,
    schema: Schema,
    options,
    callback?: Callback
  ): Promise<any> {
    var Class = this // eslint-disable-line consistent-this
    var instance = new Class()
    return instance.parse.apply(instance, arguments)
  }

  /**
   * Parses the given JSON schema.
   * This method does not resolve any JSON references.
   * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
   *
   * @param {string} [path] - The file path or URL of the JSON schema
   * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed
   * @param {function} [callback] - An error-first callback. The second parameter is the parsed JSON schema object.
   * @returns {Promise} - The returned promise resolves with the parsed JSON schema object.
   */
  parse(path: string): Promise<any>
  parse(schema: Schema): Promise<any>
  parse(path: string, schema: Schema): Promise<any>
  parse(path: string, options: $RefParserOptions): Promise<any>
  parse(schema: Schema, options: $RefParserOptions): Promise<any>
  parse(
    path: string,
    schema: Schema | undefined,
    options: $RefParserOptions
  ): Promise<any>
  parse(path: string, cb: Callback): void
  parse(schema: Schema, cb: Callback): void
  parse(path: string, schema: Schema, cb: Callback): void
  parse(path: string, options: $RefParserOptions, cb: Callback): void
  parse(schema: Schema, options: $RefParserOptions, cb: Callback): void
  parse(
    path: string,
    schema: Schema,
    options: $RefParserOptions,
    cb: Callback
  ): void
  parse(
    pos: string | Schema,
    soooc?: Schema | $RefParserOptions | Callback,
    ooc?: $RefParserOptions | Callback,
    cb?: Callback
  ): Promise<any> | void {
    var args = normalizeArgs(arguments as any)
    var promise

    if (!args.path && !args.schema) {
      var err = ono(
        'Expected a file path, URL, or object. Got %s',
        args.path || args.schema
      )
      return maybe(args.callback, Promise.reject(err))
    }

    // Reset everything
    this.schema = null
    this.$refs = new $Refs()

    // If the path is a filesystem path, then convert it to a URL.
    // NOTE: According to the JSON Reference spec, these should already be URLs,
    // but, in practice, many people use local filesystem paths instead.
    // So we're being generous here and doing the conversion automatically.
    // This is not intended to be a 100% bulletproof solution.
    // If it doesn't work for your use-case, then use a URL instead.
    var pathType = 'http'
    if (isFileSystemPath(args.path)) {
      args.path = fromFileSystemPath(args.path)
      pathType = 'file'
    }

    // Resolve the absolute path of the schema
    args.path = resolve(cwd(), args.path)

    if (args.schema && typeof args.schema === 'object') {
      // A schema object was passed-in.
      // So immediately add a new $Ref with the schema object as its value
      var $ref = this.$refs._add(args.path)
      $ref.value = args.schema
      $ref.pathType = pathType
      promise = Promise.resolve(args.schema)
    } else {
      // Parse the schema file/url
      promise = parse(args.path, this.$refs, args.options)
    }

    var me = this
    return maybe(
      args.callback,
      promise.then(function(result) {
        if (!result || typeof result !== 'object' || Buffer.isBuffer(result)) {
          throw ono.syntax(
            '"%s" is not a valid JSON Schema',
            me.$refs._root$Ref ? me.$refs._root$Ref.path : result
          )
        } else {
          me.schema = result
          return me.schema
        }
      })
    )
  }

  /**
   * Parses the given JSON schema and resolves any JSON references, including references in
   * externally-referenced files.
   *
   * @param {string} [path] - The file path or URL of the JSON schema
   * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed and resolved
   * @param {function} [callback]
   * - An error-first callback. The second parameter is a {@link $Refs} object containing the resolved JSON references
   *
   * @returns {Promise}
   * The returned promise resolves with a {@link $Refs} object containing the resolved JSON references
   */
  static resolve(
    path: string,
    schema: Schema,
    options: Partial<$RefParserOptions>,
    callback?: Callback
  ): Promise<any> | void {
    var Class = this // eslint-disable-line consistent-this
    var instance = new Class()
    return instance.resolve.apply(instance, arguments)
  }

  /**
   * Parses the given JSON schema and resolves any JSON references, including references in
   * externally-referenced files.
   *
   * @param {string} [path] - The file path or URL of the JSON schema
   * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed and resolved
   * @param {function} [callback]
   * - An error-first callback. The second parameter is a {@link $Refs} object containing the resolved JSON references
   *
   * @returns {Promise}
   * The returned promise resolves with a {@link $Refs} object containing the resolved JSON references
   */
  resolve(
    path: string,
    schema?: Schema,
    options?: Partial<$RefParserOptions>
  ): Promise<any>
  resolve(
    path: string,
    schema?: Schema,
    options?: Partial<$RefParserOptions>,
    callback?: Callback
  ): Promise<any> | void {
    var me = this
    var args = normalizeArgs(arguments as any)

    return maybe(
      args.callback,
      this.parse(args.path, args.schema, args.options)
        .then(function() {
          return resolveExternal(me, args.options) as any
        })
        .then(function() {
          return me.$refs
        })
    )
  }

  /**
   * Parses the given JSON schema, resolves any JSON references, and bundles all external references
   * into the main JSON schema. This produces a JSON schema that only has *internal* references,
   * not any *external* references.
   *
   * @param {string} [path] - The file path or URL of the JSON schema
   * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
   * @param {function} [callback] - An error-first callback. The second parameter is the bundled JSON schema object
   * @returns {Promise} - The returned promise resolves with the bundled JSON schema object.
   */
  static bundle(
    path: string,
    schema: Schema,
    options: Partial<$RefParserOptions>,
    callback?: Callback
  ): Promise<any> {
    var Class = this // eslint-disable-line consistent-this
    var instance = new Class()
    return instance.bundle.apply(instance, arguments)
  }

  /**
   * Parses the given JSON schema, resolves any JSON references, and bundles all external references
   * into the main JSON schema. This produces a JSON schema that only has *internal* references,
   * not any *external* references.
   *
   * @param {string} [path] - The file path or URL of the JSON schema
   * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
   * @param {function} [callback] - An error-first callback. The second parameter is the bundled JSON schema object
   * @returns {Promise} - The returned promise resolves with the bundled JSON schema object.
   */
  bundle(
    path: string,
    schema: Schema,
    options: Partial<$RefParserOptions>,
    callback?: Callback
  ): Promise<any> | void {
    var me = this
    var args = normalizeArgs(arguments as any)

    return maybe(
      args.callback,
      this.resolve(args.path, args.schema, args.options).then(function() {
        bundle(me, args.options)
        return me.schema
      })
    )
  }

  /**
   * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
   * That is, all JSON references are replaced with their resolved values.
   *
   * @param {string} [path] - The file path or URL of the JSON schema
   * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
   * @param {function} [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
   * @returns {Promise} - The returned promise resolves with the dereferenced JSON schema object.
   */
  static dereference(
    path: string,
    schema: Schema,
    options: Partial<$RefParserOptions>,
    callback?: Callback
  ): Promise<any> {
    var Class = this // eslint-disable-line consistent-this
    var instance = new Class()
    return instance.dereference.apply(instance, arguments)
  }

  /**
   * Parses the given JSON schema, resolves any JSON references, and dereferences the JSON schema.
   * That is, all JSON references are replaced with their resolved values.
   *
   * @param {string} [path] - The file path or URL of the JSON schema
   * @param {object} [schema] - A JSON schema object. This object will be used instead of reading from `path`.
   * @param {$RefParserOptions} [options] - Options that determine how the schema is parsed, resolved, and dereferenced
   * @param {function} [callback] - An error-first callback. The second parameter is the dereferenced JSON schema object
   * @returns {Promise} - The returned promise resolves with the dereferenced JSON schema object.
   */
  dereference(
    path: string,
    schema: Schema,
    options: Partial<$RefParserOptions>,
    callback?: Callback
  ): Promise<any> | void {
    var me = this
    var args = normalizeArgs(arguments as any)
    return maybe(
      args.callback,
      this.resolve(args.path, args.schema, args.options).then(function() {
        dereference(me, args.options)
        return me.schema
      })
    )
  }
}
;($RefParser as any).YAML = YAML
export = $RefParser
