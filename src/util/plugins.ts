import debug from './debug'
import { FileObject } from '../types'

/**
 * Returns the given plugins as an array, rather than an object map.
 * All other methods in this module expect an array of plugins rather than an object map.
 *
 * @param  {object} plugins - A map of plugin objects
 * @return {object[]}
 */
export function all<T extends Plugin<any, any, any>>(
  plugins: Record<string, T | boolean>
) {
  return Object.keys(plugins)
    .filter(key => typeof plugins[key] === 'object')
    .map(function(key) {
      ;(plugins[key] as Exclude<T, boolean>).name = key
      return plugins[key] as T & { name: string }
    })
}

/**
 * Filters the given plugins, returning only the ones return `true` for the given method.
 *
 * @param  {object[]} plugins - An array of plugin objects
 * @param  {string}   method  - The name of the filter method to invoke for each plugin
 * @param  {object}   file    - A file info object, which will be passed to each method
 * @return {object[]}
 */
export function filter<
  M extends string,
  R,
  F extends FileObject,
  P extends Plugin<M, R, F>
>(plugins: P[], method: M, file: F) {
  return plugins.filter(function(plugin) {
    return !!getResult(plugin, method, file)
  })
}

/**
 * Sorts the given plugins, in place, by their `order` property.
 *
 * @param {object[]} plugins - An array of plugin objects
 * @returns {object[]}
 */
export function sort<
  M extends string,
  R,
  F extends FileObject,
  P extends Plugin<M, R, F>
>(plugins: P[]) {
  plugins.forEach(function(plugin) {
    plugin.order = plugin.order || Number.MAX_SAFE_INTEGER
  })

  return plugins.sort(function(a, b) {
    return a.order! - b.order!
  })
}

export type Plugin<M extends string, R, F> = {
  [K in M]: string | string[] | RegExp | ((file: F) => R)
} & {
  order?: number
  name?: string
}

/**
 * Runs the specified method of the given plugins, in order, until one of them returns a successful result.
 * Each method can return a synchronous value, a Promise, or call an error-first callback.
 * If the promise resolves successfully, or the callback is called without an error, then the result
 * is immediately returned and no further plugins are called.
 * If the promise rejects, or the callback is called with an error, then the next plugin is called.
 * If ALL plugins fail, then the last error is thrown.
 *
 * @param {object[]}  plugins - An array of plugin objects
 * @param {string}    method  - The name of the method to invoke for each plugin
 * @param {object}    file    - A file info object, which will be passed to each method
 * @returns {Promise}
 */
export function run<
  M extends string,
  R extends any | PromiseLike<any>,
  F extends FileObject,
  P extends Plugin<M, R, F>
>(
  plugins: P[],
  method: M,
  file: F
): Promise<{
  plugin: P
  result: R
}> {
  let plugin: P | undefined,
    lastError,
    index = 0

  return new Promise(function(resolve, reject) {
    runNextPlugin()

    function runNextPlugin() {
      plugin = plugins[index++]
      if (!plugin) {
        // There are no more functions, so re-throw the last error
        return reject(lastError)
      }

      try {
        debug('  %s', plugin.name)
        const result = getResult<M, R, F, P>(plugin, method, file, callback)
        if (typeof result === 'object' && typeof result.then === 'function') {
          // A promise was returned
          result.then(onSuccess, onError)
        } else if (result !== undefined) {
          // A synchronous result was returned
          onSuccess(result)
        }
        // else { the callback will be called }
      } catch (e) {
        onError(e)
      }
    }

    function callback(err, result) {
      if (err) {
        onError(err)
      } else {
        onSuccess(result)
      }
    }

    function onSuccess(result) {
      debug('    success')
      resolve({
        plugin: plugin,
        result: result
      } as { plugin: P; result: R })
    }

    function onError(err) {
      debug('    %s', err.message || err)
      lastError = err
      runNextPlugin()
    }
  })
}

/**
 * Returns the value of the given property.
 * If the property is a function, then the result of the function is returned.
 * If the value is a RegExp, then it will be tested against the file URL.
 * If the value is a string or an array of strings, then it will be compared against the file extension.
 *
 * @param   {object}   obj        - The object whose property/method is called
 * @param   {string}   prop       - The name of the property/method to invoke
 * @param   {object}   file       - A file info object, which will be passed to the method
 * @param   {function} [callback] - A callback function, which will be passed to the method
 * @returns {*}
 */
function getResult<
  P extends string,
  R,
  F extends FileObject,
  O extends Record<P, V> | Plugin<P, R, F>,
  V extends
    | boolean // undocumented, used in `should use a custom parser with static values` test
    | string // both for comparing to suffix and passed through in a test
    | string[]
    | RegExp
    | ((file: F, callback?: (err, data) => void) => R) = O extends Plugin<
    P,
    R,
    F
  >
    ? () => R
    : O extends Record<P, V> ? V : never
>(obj: O, prop: P, file: F, callback?: (err, data) => void): R | boolean | V {
  var value: V = obj[prop] as any

  if (typeof value === 'function') {
    return ((obj[prop] as any) as Exclude<
      typeof value,
      boolean | string | string[] | RegExp
    >)(file, callback)
  }

  if (!callback) {
    // The synchronous plugin functions (canParse and canRead)
    // allow a "shorthand" syntax, where the user can match
    // files by RegExp or by file extension.
    if (value instanceof RegExp) {
      return value.test(file.url)
    } else if (typeof value === 'string') {
      return value === file.extension
    } else if (Array.isArray(value)) {
      return value.indexOf(file.extension) !== -1
    }
  }

  // CASE 1:
  // There is no callback, yet the value wasn't a string|string[]|RegExp
  // Must be a boolean.
  // Let's return it verbatim.
  if (!callback && typeof value !== 'boolean') {
    console.error([obj, prop, file, callback])
    throw new Error('How did we get here?')
  }
  // CASE 2:
  // There was a callback.
  // Yet the value was not a function!
  // So, we return it instead of calling it with the callback.
  // Poor callback, it will never be called.

  return value
}
