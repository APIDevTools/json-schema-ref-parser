import $Ref from './ref'
import Pointer from './pointer'
import parse from './parse'
import debug from './util/debug'
import { resolve, stripHash } from './util/url'
import $RefParserOptions from './options'
import $Refs from './refs'

export default resolveExternal

/**
 * Crawls the JSON schema, finds all external JSON references, and resolves their values.
 * This method does not mutate the JSON schema. The resolved values are added to {@link $RefParser#$refs}.
 *
 * NOTE: We only care about EXTERNAL references here. INTERNAL references are only relevant when dereferencing.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves once all JSON references in the schema have been resolved,
 * including nested references that are contained in externally-referenced files.
 */
function resolveExternal(parser, options) {
  if (!options.resolve.external) {
    // Nothing to resolve, so exit early
    return Promise.resolve()
  }

  try {
    debug('Resolving $ref pointers in %s', parser.$refs._root$Ref.path)
    var promises = crawl(
      parser.schema,
      parser.$refs._root$Ref.path + '#',
      parser.$refs,
      options
    )
    return Promise.all(promises)
  } catch (e) {
    return Promise.reject(e)
  }
}

/**
 * Recursively crawls the given value, and resolves any external JSON references.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {string} path - The full path of `obj`, possibly with a JSON Pointer in the hash
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 *
 * @returns {Promise[]}
 * Returns an array of promises. There will be one promise for each JSON reference in `obj`.
 * If `obj` does not contain any JSON references, then the array will be empty.
 * If any of the JSON references point to files that contain additional JSON references,
 * then the corresponding promise will internally reference an array of promises.
 */
function crawl(
  obj: any,
  path: string,
  $refs: $Refs,
  options: $RefParserOptions
) {
  const promises: Promise<any>[] = []

  if (obj && typeof obj === 'object') {
    if ($Ref.isExternal$Ref(obj)) {
      promises.push(resolve$Ref(obj, path, $refs, options))
    } else {
      Object.keys(obj).forEach(function(key) {
        const keyPath = Pointer.join(path, key)
        const value = obj[key]

        if ($Ref.isExternal$Ref(value)) {
          promises.push(resolve$Ref(value, keyPath, $refs, options))
        } else {
          promises.push(
            ...promises.concat(crawl(value, keyPath, $refs, options))
          )
        }
      })
    }
  }

  return promises
}

/**
 * Resolves the given JSON Reference, and then crawls the resulting value.
 *
 * @param {{$ref: string}} $ref - The JSON Reference to resolve
 * @param {string} path - The full path of `$ref`, possibly with a JSON Pointer in the hash
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves once all JSON references in the object have been resolved,
 * including nested references that are contained in externally-referenced files.
 */
function resolve$Ref(
  $ref: { $ref: string },
  path: string,
  $refs: $Refs,
  options: $RefParserOptions
) {
  debug('Resolving $ref pointer "%s" at %s', $ref.$ref, path)

  const resolvedPath = resolve(path, $ref.$ref)
  const withoutHash = stripHash(resolvedPath)
  {
    // Do we already have this $ref?
    const $ref: $Ref = $refs._$refs[withoutHash]
    if ($ref) {
      // We've already parsed this $ref, so use the existing value
      return Promise.resolve($ref.value)
    }
  }

  // Parse the $referenced file/url
  return parse(resolvedPath, $refs, options).then(function(result) {
    // Crawl the parsed value
    debug('Resolving $ref pointers in %s', withoutHash)
    const promises = crawl(result, withoutHash + '#', $refs, options)
    return Promise.all(promises)
  })
}
