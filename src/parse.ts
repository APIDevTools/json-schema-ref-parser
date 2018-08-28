import * as ono from 'ono'
import debug from './util/debug'
import { stripHash, getExtension } from './util/url'
import { all, filter, sort, run } from './util/plugins'
import { FileObject, FileWithData } from './types'
import $Refs from './refs'
import $RefParserOptions from './options'

export default parse
/**
 * Reads and parses the specified file path or URL.
 *
 * @param {string} path - This path MUST already be resolved, since `read` doesn't know the resolution context
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with the parsed file contents, NOT the raw (Buffer) contents.
 */
function parse(path: string, $refs: $Refs, options: $RefParserOptions) {
  try {
    // Remove the URL fragment, if any
    path = stripHash(path)

    // Add a new $Ref for this file, even though we don't have the value yet.
    // This ensures that we don't simultaneously read & parse the same file multiple times
    const $ref = $refs._add(path)

    // This "file object" will be passed to all resolvers and parsers.
    const file = {
      url: path,
      extension: getExtension(path)
    } as FileObject & Partial<FileWithData>

    // Read the file and then parse the data
    return readFile(file, options)
      .then(function(resolver) {
        $ref.pathType = resolver.plugin.name
        file.data = resolver.result
        return parseFile(file as FileWithData, options)
      })
      .then(function(parser) {
        $ref.value = parser.result
        return parser.result
      })
  } catch (e) {
    return Promise.reject(e)
  }
}

/**
 * Reads the given file, using the configured resolver plugins
 *
 * @param {object} file           - An object containing information about the referenced file
 * @param {string} file.url       - The full URL of the referenced file
 * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with the raw file contents and the resolver that was used.
 */
function readFile(file: FileObject, options: $RefParserOptions) {
  debug('Reading %s', file.url)

  // Find the resolvers that can read this file
  let resolvers = all(options.resolve)
  resolvers = filter(resolvers, 'canRead', file)

  // Run the resolvers, in order, until one of them succeeds
  resolvers = sort(resolvers)
  return run(resolvers, 'read', file).catch(err => {
    // Throw the original error, if it's one of our own (user-friendly) errors.
    // Otherwise, throw a generic, friendly error.
    if (err && !(err instanceof SyntaxError)) {
      throw err
    } else {
      throw ono.syntax('Unable to resolve $ref pointer "%s"', file.url)
    }
  })
}

/**
 * Parses the given file's contents, using the configured parser plugins.
 *
 * @param {object} file           - An object containing information about the referenced file
 * @param {string} file.url       - The full URL of the referenced file
 * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
 * @param {*}      file.data      - The file contents. This will be whatever data type was returned by the resolver
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with the parsed file contents and the parser that was used.
 */
function parseFile(file, options: $RefParserOptions) {
  debug('Parsing %s', file.url)

  // Find the parsers that can read this file type.
  // If none of the parsers are an exact match for this file, then we'll try ALL of them.
  // This handles situations where the file IS a supported type, just with an unknown extension.
  var allParsers = all(options.parse)
  var filteredParsers = filter(allParsers, 'canParse', file)
  var parsers = filteredParsers.length > 0 ? filteredParsers : allParsers

  // Run the parsers, in order, until one of them succeeds
  parsers = sort(parsers)
  return run(parsers, 'parse', file).then(
    function onParsed(parser) {
      if (!parser.plugin.allowEmpty && isEmpty(parser.result)) {
        throw ono.syntax(
          'Error parsing "%s" as %s. \nParsed value is empty',
          file.url,
          parser.plugin.name
        )
      } else {
        return parser
      }
    },
    function onError(err) {
      if (err) {
        err = err instanceof Error ? err : new Error(err)
        throw ono.syntax(err, 'Error parsing %s', file.url)
      } else {
        throw ono.syntax('Unable to parse %s', file.url)
      }
    }
  )
}

/**
 * Determines whether the parsed value is "empty".
 *
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value: any) {
  return (
    value === undefined ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Buffer.isBuffer(value) && value.length === 0)
  )
}
