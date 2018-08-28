import * as http from 'http'
import * as https from 'https'
import * as ono from 'ono'
import { parse, isHttp, resolve as urlResolve } from '../util/url'
import debug from '../util/debug'

declare const process: NodeJS.Process & { browser?: any }

export default {
  /**
   * The order that this resolver will run, in relation to other resolvers.
   *
   * @type {number}
   */
  order: 200,

  /**
   * HTTP headers to send when downloading files.
   *
   * @example:
   * {
   *   "User-Agent": "JSON Schema $Ref Parser",
   *   Accept: "application/json"
   * }
   *
   * @type {object}
   */
  headers: null,

  /**
   * HTTP request timeout (in milliseconds).
   *
   * @type {number}
   */
  timeout: 5000, // 5 seconds

  /**
   * The maximum number of HTTP redirects to follow.
   * To disable automatic following of redirects, set this to zero.
   *
   * @type {number}
   */
  redirects: 5,

  /**
   * The `withCredentials` option of XMLHttpRequest.
   * Set this to `true` if you're downloading files from a CORS-enabled server that requires authentication
   *
   * @type {boolean}
   */
  withCredentials: false,

  /**
   * Determines whether this resolver can read a given file reference.
   * Resolvers that return true will be tried in order, until one successfully resolves the file.
   * Resolvers that return false will not be given a chance to resolve the file.
   *
   * @param {object} file           - An object containing information about the referenced file
   * @param {string} file.url       - The full URL of the referenced file
   * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
   * @returns {boolean}
   */
  canRead: file => isHttp(file.url),
  /**
   * Reads the given URL and returns its raw contents as a Buffer.
   *
   * @param {object} file           - An object containing information about the referenced file
   * @param {string} file.url       - The full URL of the referenced file
   * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
   * @returns {Promise<Buffer>}
   */
  read: function readHttp(file) {
    var u = parse(file.url)

    if (process.browser && !u.protocol) {
      // Use the protocol of the current page
      u.protocol = parse(location.href).protocol
    }

    return download(u, this)
  }
}

/**
 * Downloads the given file.
 *
 * @param {Url|string} u        - The url to download (can be a parsed {@link Url} object)
 * @param {object} httpOptions  - The `options.resolve.http` object
 * @param {number} [redirects]  - The redirect URLs that have already been followed
 *
 * @returns {Promise<Buffer>}
 * The promise resolves with the raw downloaded data, or rejects if there is an HTTP error.
 */
function download(u, httpOptions, redirects?) {
  return new Promise(function(resolve, reject) {
    u = parse(u)
    redirects = redirects || []
    redirects.push(u.href)

    get(u, httpOptions)
      .then(function(res) {
        if (res.statusCode >= 400) {
          throw ono(
            { status: res.statusCode } as any,
            'HTTP ERROR %d',
            res.statusCode
          )
        } else if (res.statusCode >= 300) {
          if (redirects.length > httpOptions.redirects) {
            reject(
              ono(
                { status: res.statusCode } as any,
                'Error downloading %s. \nToo many redirects: \n  %s',
                redirects[0],
                redirects.join(' \n  ')
              )
            )
          } else if (!res.headers.location) {
            throw ono(
              { status: res.statusCode } as any,
              'HTTP %d redirect with no location header',
              res.statusCode
            )
          } else {
            debug(
              'HTTP %d redirect %s -> %s',
              res.statusCode,
              u.href,
              res.headers.location
            )
            var redirectTo = urlResolve(u, res.headers.location)
            download(redirectTo, httpOptions, redirects).then(resolve, reject)
          }
        } else {
          resolve(res.body || new Buffer(0))
        }
      })
      .catch(function(err) {
        reject(ono(err, 'Error downloading', u.href))
      })
  })
}

/**
 * Sends an HTTP GET request.
 *
 * @param {Url} u - A parsed {@link Url} object
 * @param {object} httpOptions - The `options.resolve.http` object
 * @param {number} retries - How many times to retry dropped connections. Default: 3
 *
 * @returns {Promise<Response>}
 * The promise resolves with the HTTP Response object.
 */
function get(u, httpOptions, retries = 3) {
  return new Promise<any>(function(resolve, reject) {
    debug('GET', u.href)

    var protocol = u.protocol === 'https:' ? https : http
    var req = (protocol.get as any)({
      hostname: u.hostname,
      port: u.port,
      path: u.path,
      auth: u.auth,
      protocol: u.protocol,
      headers: httpOptions.headers || {},
      withCredentials: httpOptions.withCredentials
    })

    if (typeof req.setTimeout === 'function') {
      req.setTimeout(httpOptions.timeout)
    }

    req.on('timeout', function() {
      req.abort()
    })

    req.on('error', err => {
      if (err.code === 'ECONNRESET' && retries > 0)
        resolve(get(u, httpOptions, retries - 1))
      else reject(err)
    })

    req.once('response', function(res) {
      res.body = new Buffer(0)

      res.on('data', function(data) {
        res.body = Buffer.concat([res.body, new Buffer(data)])
      })

      res.on('error', reject)

      res.on('end', function() {
        resolve(res)
      })
    })
  })
}
