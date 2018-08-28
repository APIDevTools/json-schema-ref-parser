import * as ono from 'ono'
import $Ref from './ref'
import { resolve, stripHash, toFileSystemPath } from './util/url'

// TODO: Get rid of all `_root$Ref!.path!`
/**
 * This class is a map of JSON references and their resolved values.
 */
export default class $Refs {
  /**
   * Indicates whether the schema contains any circular references.
   *
   * @type {boolean}
   */
  circular = false

  /**
   * A map of paths/urls to {@link $Ref} objects
   *
   * @type {object}
   * @protected
   */
  _$refs: { [k: string]: $Ref } = {}

  /**
   * The {@link $Ref} object that is the root of the JSON schema.
   *
   * @type {$Ref}
   * @protected
   */
  _root$Ref: $Ref | null = null

  /**
   * Returns the paths of all the files/URLs that are referenced by the JSON schema,
   * including the schema itself.
   *
   * @param {...string|string[]} [types] - Only return paths of the given types ("file", "http", etc.)
   * @returns {string[]}
   */
  paths(types: string | string[] /* , ...rest: string[] */) {
    var paths = getPaths(this._$refs, arguments as any)
    return paths.map(function(path) {
      return path.decoded
    })
  }
  /**
   * Returns the map of JSON references and their resolved values.
   *
   * @param {...string|string[]} [types] - Only return references of the given types ("file", "http", etc.)
   * @returns {object}
   */
  values(types) {
    var $refs = this._$refs
    var paths = getPaths($refs, arguments as any)
    return paths.reduce(function(obj, path) {
      obj[path.decoded] = $refs[path.encoded].value
      return obj
    }, {})
  }
  /**
   * Returns a POJO (plain old JavaScript object) for serialization as JSON.
   *
   * @returns {object}
   */
  toJSON = this.values
  /**
   * Determines whether the given JSON reference exists.
   *
   * @param {string} path - The path being resolved, optionally with a JSON pointer in the hash
   * @param {$RefParserOptions} [options]
   * @returns {boolean}
   */
  exists(path, options) {
    try {
      this._resolve(path, options)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Resolves the given JSON reference and returns the resolved value.
   *
   * @param {string} path - The path being resolved, with a JSON pointer in the hash
   * @param {$RefParserOptions} [options]
   * @returns {*} - Returns the resolved value
   */
  get(path, options) {
    return this._resolve(path, options).value
  }

  /**
   * Sets the value of a nested property within this {@link $Ref#value}.
   * If the property, or any of its parents don't exist, they will be created.
   *
   * @param {string} path - The path of the property to set, optionally with a JSON pointer in the hash
   * @param {*} value - The value to assign
   */
  set(path, value) {
    var absPath = resolve(this._root$Ref!.path!, path)
    var withoutHash = stripHash(absPath)
    var $ref = this._$refs[withoutHash]

    if (!$ref) {
      throw ono(
        'Error resolving $ref pointer "%s". \n"%s" not found.',
        path,
        withoutHash
      )
    }

    $ref.set(absPath, value)
  }

  /**
   * Creates a new {@link $Ref} object and adds it to this {@link $Refs} object.
   *
   * @param {string} path  - The file path or URL of the referenced file
   */
  _add(path) {
    var withoutHash = stripHash(path)

    var $ref = new $Ref()
    $ref.path = withoutHash
    $ref.$refs = this

    this._$refs[withoutHash] = $ref
    this._root$Ref = this._root$Ref || $ref

    return $ref
  }

  /**
   * Resolves the given JSON reference.
   *
   * @param {string} path - The path being resolved, optionally with a JSON pointer in the hash
   * @param {$RefParserOptions} [options]
   * @returns {Pointer}
   * @protected
   */
  _resolve(path, options) {
    var absPath = resolve(this._root$Ref!.path!, path)
    var withoutHash = stripHash(absPath)
    var $ref = this._$refs[withoutHash]

    if (!$ref) {
      throw ono(
        'Error resolving $ref pointer "%s". \n"%s" not found.',
        path,
        withoutHash
      )
    }

    return $ref.resolve(absPath, options, path)
  }

  /**
   * Returns the specified {@link $Ref} object, or undefined.
   *
   * @param {string} path - The path being resolved, optionally with a JSON pointer in the hash
   * @returns {$Ref|undefined}
   * @protected
   */
  _get$Ref(path) {
    path = resolve(this._root$Ref!.path!, path)
    var withoutHash = stripHash(path)
    return this._$refs[withoutHash]
  }
}

/**
 * Returns the encoded and decoded paths keys of the given object.
 *
 * @param {object} $refs - The object whose keys are URL-encoded paths
 * @param {string[]|[string[]]} [types] - Only return paths of the given types ("file", "http", etc.)
 * @returns {object[]}
 */
function getPaths($refs: $Refs['_$refs'], types: string[] | [string[]]) {
  var paths: Exclude<keyof typeof $refs, number>[] = Object.keys($refs)

  // Filter the paths by type
  const _types: string[] = Array.isArray(types[0])
    ? types[0]
    : Array.prototype.slice.call(types)
  if (types.length > 0 && types[0]) {
    paths = paths.filter(function(key) {
      return _types.indexOf($refs[key].pathType!) !== -1
    })
  }

  // Decode local filesystem paths
  return paths.map(function(path) {
    return {
      encoded: path,
      decoded:
        $refs[path].pathType === 'file' ? toFileSystemPath(path, true) : path
    }
  })
}
