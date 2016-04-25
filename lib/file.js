'use strict';
var URL = require('./util/url');

module.exports = File;

/**
 * Contains information about a file, such as its path, type, and contents.
 * This class is mostly used to pass data to plug-ins, such as parsers and resolvers.
 *
 * @param {string} url - The full (absolute) URL of the file.
 *                       The URL may include a fragment (#), but it will be stripped off,
 *                       since this class always represents a complete file.
 */
function File(url) {
  // A `File` instance always points to a complete file, not a fragment
  url = URL.stripHash(url);

  /**
   * The file's full (absolute) URL, without any fragment (#)
   *
   * NOTE: The {@link File#url} property is always url-encoded, even for local filesystem paths.
   * To get the url-decoded path for user-friendly display purposes or for accessing the local filesystem,
   * use the {@link file#path} instead.
   *
   * @type {string}
   */
  this.url = url;

  /**
   * Indicates the type of {@link File#url} (e.g. "file", "http", etc.)
   * This is determined by the resolver that ends up resolving the file.
   *
   * @type {?string}
   */
  this.urlType = undefined;

  /**
   * This is the same as {@link File#url}, except that it is NOT url-encoded.
   * This is most useful for local filesystem paths, since "file:///foo%20bar.json" will be
   * converted to "/foo bar.json".
   *
   * For other types of URLs, this property is simply the url-decoded version of {@link File#url},
   * which may still be useful for display or logging purposes, since it will be more human-readable.
   *
   * @type {string}
   */
  this.path = decodeURI(url);

  /**
   * The file's extension (including the "."), in lowercase.
   * If the file has no extension, then this will be an empty string.
   *
   * @type {string}
   */
  this.extension = URL.getExtension(url);

  /**
   * The file's data. This may be the raw (unparsed) file data,
   * or it may be parsed and/or dereferenced. To determine this, check the {@link File#parsed} and
   * {@link File#dereferenced} properties.
   *
   * @type {*}
   */
  this.data = undefined;

  /**
   * Indicates the type of {@link File#data} (e.g. "json", "yaml", "text", "binary", etc.)
   * This is determined by the parser that ends up parsing the file's data.
   *
   * @type {?string}
   */
  this.dataType = undefined;

  /**
   * Whether the {@link File#data} property has been parsed
   * (as opposed to being the raw, unparsed file contents).
   *
   * @type {boolean}
   */
  this.parsed = false;

  /**
   * Whether the {@link File#data} property has been dereferenced,
   * meaning that the data does not contain any `$ref` pointers,
   * because they have all been replaced with their resolved values.
   *
   * @type {boolean}
   */
  this.dereferenced = false;
}
