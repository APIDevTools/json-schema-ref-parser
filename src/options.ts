/* eslint lines-around-comment: [2, {beforeBlockComment: false}] */

import jsonParser from './parsers/json'
import yamlParser from './parsers/yaml'
import textParser from './parsers/text'
import binaryParser from './parsers/binary'
import fileResolver from './resolvers/file'
import httpResolver from './resolvers/http'
import { Plugin } from './util/plugins'
import { FileObject } from './types'
/**
 * Options that determine how JSON schemas are parsed, resolved, and dereferenced.
 */
export default class $RefParserOptions {
  /**
   * @param {object|$RefParserOptions} [options] - Overridden options
   */
  constructor(options?: Partial<$RefParserOptions>) {
    merge(this, options)
  }

  /**
   * Determines how different types of files will be parsed.
   *
   * You can add additional parsers of your own, replace an existing one with
   * your own implemenation, or disable any parser by setting it to false.
   */
  parse: {
    [k: string]: Plugin<'canParse', boolean, FileObject> &
      Plugin<'parse', any, FileObject> & { allowEmpty?: boolean } & Record<
        any,
        any
      >
  } = merge({}, $RefParserOptions.defaults.parse)

  /**
   * Determines how JSON References will be resolved.
   *
   * You can add additional resolvers of your own, replace an existing one with
   * your own implemenation, or disable any resolver by setting it to false.
   */
  resolve: {
    [k: string]:
      | Plugin<'canRead', boolean, FileObject> &
          Plugin<'read', any, FileObject> &
          Record<any, any>
      | boolean
  } & {
    /**
     * Determines whether external $ref pointers will be resolved.
     * If this option is disabled, then none of above resolvers will be called.
     * Instead, external $ref pointers will simply be ignored.
     *
     * @type {boolean}
     */
    external: boolean
  } = merge({}, $RefParserOptions.defaults.resolve)

  /**
   * Determines the types of JSON references that are allowed.
   */
  dereference: {
    /**
     * Dereference circular (recursive) JSON references?
     * If false, then a {@link ReferenceError} will be thrown if a circular reference is found.
     * If "ignore", then circular references will not be dereferenced.
     *
     * @type {boolean|string}
     */
    circular: boolean | string
  } = merge({}, $RefParserOptions.defaults.dereference)

  static defaults = {
    /**
     * Determines how different types of files will be parsed.
     *
     * You can add additional parsers of your own, replace an existing one with
     * your own implemenation, or disable any parser by setting it to false.
     */
    parse: {
      json: jsonParser,
      yaml: yamlParser,
      text: textParser,
      binary: binaryParser
    },

    /**
     * Determines how JSON References will be resolved.
     *
     * You can add additional resolvers of your own, replace an existing one with
     * your own implemenation, or disable any resolver by setting it to false.
     */
    resolve: {
      file: fileResolver,
      http: httpResolver,

      /**
       * Determines whether external $ref pointers will be resolved.
       * If this option is disabled, then none of above resolvers will be called.
       * Instead, external $ref pointers will simply be ignored.
       *
       * @type {boolean}
       */
      external: true
    },

    /**
     * Determines the types of JSON references that are allowed.
     */
    dereference: {
      /**
       * Dereference circular (recursive) JSON references?
       * If false, then a {@link ReferenceError} will be thrown if a circular reference is found.
       * If "ignore", then circular references will not be dereferenced.
       *
       * @type {boolean|string}
       */
      circular: true
    }
  }
}

/**
 * Merges the properties of the source object into the target object.
 *
 * @param {object} target - The object that we're populating
 * @param {?object} source - The options that are being merged
 * @returns {object}
 */
function merge<T extends object, S extends object>(
  target: T,
  source: S | undefined
) {
  if (isMergeable(source)) {
    const keys = Object.keys(source)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const sourceSetting: any = source[key]
      const targetSetting = target[key]

      if (isMergeable(sourceSetting)) {
        // It's a nested object, so merge it recursively
        target[key] = merge(targetSetting || {}, sourceSetting)
      } else if (sourceSetting !== undefined) {
        // It's a scalar value, function, or array. No merging necessary. Just overwrite the target value.
        target[key] = sourceSetting
      }
    }
  }
  return target as typeof source extends undefined ? T : T & S
}

/**
 * Determines whether the given value can be merged,
 * or if it is a scalar value that should just override the target value.
 *
 * @param   {*}  val
 * @returns {Boolean}
 */
function isMergeable(val: any): val is Exclude<object | any[], RegExp | Date> {
  return (
    val &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    !(val instanceof RegExp) &&
    !(val instanceof Date)
  )
}
