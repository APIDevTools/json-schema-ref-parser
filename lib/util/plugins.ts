import type { FileInfo, JSONSchema } from "../types/index.js";
import type { ParserOptions } from "../options.js";
import type { ResolverOptions } from "../types/index.js";
import type $Refs from "../refs.js";
import type { Plugin } from "../types/index.js";

/**
 * Returns the given plugins as an array, rather than an object map.
 * All other methods in this module expect an array of plugins rather than an object map.
 *
 * @returns
 */
export function all<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  plugins: O["resolve"],
): Plugin[] {
  return (Object.keys(plugins || {}) as (keyof ResolverOptions<S>)[])
    .filter((key) => {
      return typeof plugins![key] === "object";
    })
    .map((key) => {
      (plugins![key] as ResolverOptions<S>)!.name = key;
      return plugins![key] as Plugin;
    });
}

/**
 * Filters the given plugins, returning only the ones return `true` for the given method.
 */
export function filter<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  plugins: Plugin[],
  method: keyof Plugin | keyof ResolverOptions<S>,
  file: FileInfo,
  callback?: (err?: Error, result?: any) => void,
  $refs?: $Refs<S, O>,
) {
  return plugins.filter((plugin: Plugin) => {
    return !!getResult(plugin, method, file, callback, $refs);
  });
}

/**
 * Sorts the given plugins, in place, by their `order` property.
 */
export function sort(plugins: Plugin[]) {
  return plugins.sort((a: Plugin, b: Plugin) => {
    return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
  });
}

export interface PluginResult<S extends object = JSONSchema> {
  plugin: Plugin;
  result?: string | Buffer | S;
  error?: any;
}

/**
 * Runs the specified method of the given plugins, in order, until one of them returns a successful result.
 * Each method can return a synchronous value, a Promise, or call an error-first callback.
 * If the promise resolves successfully, or the callback is called without an error, then the result
 * is immediately returned and no further plugins are called.
 * If the promise rejects, or the callback is called with an error, then the next plugin is called.
 * If ALL plugins fail, then the last error is thrown.
 */
export async function run<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  plugins: Plugin[],
  method: keyof Plugin | keyof ResolverOptions<S>,
  file: FileInfo,
  $refs: $Refs<S, O>,
) {
  let lastError: PluginResult<S> | undefined;
  let index = 0;

  return new Promise<PluginResult<S>>((resolve, reject) => {
    runNextPlugin();

    function runNextPlugin() {
      const plugin = plugins[index++];
      if (!plugin) {
        // There are no more functions, so re-throw the last error
        return reject(lastError);
      }

      let settled = false;
      let callbackCalled = false;

      const callback = (err: PluginResult<S>["error"], result: PluginResult<S>["result"]) => {
        callbackCalled = true;
        if (settled) {
          return;
        }

        settled = true;
        if (err) {
          onError(plugin, err);
        } else {
          onSuccess(plugin, result);
        }
      };

      try {
        // console.log('  %s', plugin.name);
        const result = getResult(plugin, method, file, callback, $refs);
        if (result && typeof result.then === "function") {
          // A promise was returned
          result.then(
            (value: PluginResult<S>["result"]) => callback(undefined, value),
            (error: PluginResult<S>["error"]) => callback(error, undefined),
          );
        } else if (result !== undefined) {
          // A synchronous result was returned
          callback(undefined, result);
        } else if (!callbackCalled && !acceptsCallback(plugin, method)) {
          callback(new Error("No promise has been returned or callback has been called."), undefined);
        }
      } catch (e) {
        callback(e, undefined);
      }
    }

    function onSuccess(plugin: Plugin, result: PluginResult<S>["result"]) {
      // console.log('    success');
      resolve({
        plugin,
        result: result!,
      });
    }

    function onError(plugin: Plugin, error: PluginResult<S>["error"]) {
      // console.log('    %s', err.message || err);
      lastError = {
        plugin,
        error,
      };
      runNextPlugin();
    }
  });
}

function acceptsCallback<S extends object = JSONSchema>(
  plugin: Plugin,
  method: keyof Plugin | keyof ResolverOptions<S>,
) {
  const value = plugin[method as keyof Plugin];
  return typeof value === "function" && value.length >= 2;
}

/**
 * Returns the value of the given property.
 * If the property is a function, then the result of the function is returned.
 * If the value is a RegExp, then it will be tested against the file URL.
 * If the value is an array, then it will be compared against the file extension.
 */
function getResult<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  obj: Plugin,
  prop: keyof Plugin | keyof ResolverOptions<S>,
  file: FileInfo,
  callback?: (err?: Error, result?: any) => void,
  $refs?: $Refs<S, O>,
) {
  const value = obj[prop as keyof typeof obj] as unknown;

  if (typeof value === "function") {
    return value.apply(obj, [file, callback, $refs]);
  }

  if (!callback) {
    // The synchronous plugin functions (canParse and canRead)
    // allow a "shorthand" syntax, where the user can match
    // files by RegExp or by file extension.
    if (value instanceof RegExp) {
      value.lastIndex = 0;
      const matches = value.test(file.url);
      value.lastIndex = 0;
      return matches;
    } else if (typeof value === "string") {
      return value === file.extension;
    } else if (Array.isArray(value)) {
      return value.indexOf(file.extension) !== -1;
    }
  }

  return value;
}
