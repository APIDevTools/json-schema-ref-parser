import $Ref from "./ref.js";
import Pointer from "./pointer.js";
import { ono } from "@jsdevtools/ono";
import * as url from "./util/url.js";
import type $Refs from "./refs.js";
import type $RefParserOptions from "./options.js";

export default dereference;

/**
 * Crawls the JSON schema, finds all JSON references, and dereferences them.
 * This method mutates the JSON schema object, replacing JSON references with their resolved value.
 *
 * @param parser
 * @param options
 */
function dereference(parser: any, options: any) {
  // console.log('Dereferencing $ref pointers in %s', parser.$refs._root$Ref.path);
  const dereferenced = crawl(
    parser.schema,
    parser.$refs._root$Ref.path,
    "#",
    new Set(),
    new Set(),
    new Map(),
    parser.$refs,
    options,
  );
  parser.$refs.circular = dereferenced.circular;
  parser.schema = dereferenced.value;
}

/**
 * Recursively crawls the given value, and dereferences any JSON references.
 *
 * @param obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param path - The full path of `obj`, possibly with a JSON Pointer in the hash
 * @param pathFromRoot - The path of `obj` from the schema root
 * @param parents - An array of the parent objects that have already been dereferenced
 * @param processedObjects - An array of all the objects that have already been processed
 * @param dereferencedCache - An map of all the dereferenced objects
 * @param $refs
 * @param options
 * @returns
 */
function crawl(
  obj: any,
  path: string,
  pathFromRoot: string,
  parents: Set<any>,
  processedObjects: Set<any>,
  dereferencedCache: any,
  $refs: $Refs,
  options: $RefParserOptions,
) {
  let dereferenced;
  const result = {
    value: obj,
    circular: false,
  };

  const isExcludedPath = options.dereference.excludedPathMatcher || (() => false);

  if (options.dereference.circular === "ignore" || !processedObjects.has(obj)) {
    if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !isExcludedPath(pathFromRoot)) {
      parents.add(obj);
      processedObjects.add(obj);

      if ($Ref.isAllowed$Ref(obj, options)) {
        dereferenced = dereference$Ref(
          obj,
          path,
          pathFromRoot,
          parents,
          processedObjects,
          dereferencedCache,
          $refs,
          options,
        );
        result.circular = dereferenced.circular;
        result.value = dereferenced.value;
      } else {
        for (const key of Object.keys(obj)) {
          const keyPath = Pointer.join(path, key);
          const keyPathFromRoot = Pointer.join(pathFromRoot, key);

          if (isExcludedPath(keyPathFromRoot)) {
            continue;
          }

          const value = obj[key];
          let circular = false;

          if ($Ref.isAllowed$Ref(value, options)) {
            dereferenced = dereference$Ref(
              value,
              keyPath,
              keyPathFromRoot,
              parents,
              processedObjects,
              dereferencedCache,
              $refs,
              options,
            );
            circular = dereferenced.circular;
            // Avoid pointless mutations; breaks frozen objects to no profit
            if (obj[key] !== dereferenced.value) {
              obj[key] = dereferenced.value;
              if (options.dereference.onDereference) {
                options.dereference.onDereference(value.$ref, obj[key]);
              }
            }
          } else {
            if (!parents.has(value)) {
              dereferenced = crawl(
                value,
                keyPath,
                keyPathFromRoot,
                parents,
                processedObjects,
                dereferencedCache,
                $refs,
                options,
              );
              circular = dereferenced.circular;
              // Avoid pointless mutations; breaks frozen objects to no profit
              if (obj[key] !== dereferenced.value) {
                obj[key] = dereferenced.value;
              }
            } else {
              circular = foundCircularReference(keyPath, $refs, options);
            }
          }

          // Set the "isCircular" flag if this or any other property is circular
          result.circular = result.circular || circular;
        }
      }

      parents.delete(obj);
    }
  }

  return result;
}

/**
 * Dereferences the given JSON Reference, and then crawls the resulting value.
 *
 * @param $ref - The JSON Reference to resolve
 * @param path - The full path of `$ref`, possibly with a JSON Pointer in the hash
 * @param pathFromRoot - The path of `$ref` from the schema root
 * @param parents - An array of the parent objects that have already been dereferenced
 * @param processedObjects - An array of all the objects that have already been dereferenced
 * @param dereferencedCache - An map of all the dereferenced objects
 * @param $refs
 * @param options
 * @returns
 */
function dereference$Ref(
  $ref: any,
  path: any,
  pathFromRoot: any,
  parents: any,
  processedObjects: any,
  dereferencedCache: any,
  $refs: any,
  options: any,
) {
  // console.log('Dereferencing $ref pointer "%s" at %s', $ref.$ref, path);

  const isExternalRef = $Ref.isExternal$Ref($ref);
  const shouldResolveOnCwd = isExternalRef && options?.dereference.externalReferenceResolution === "root";
  const $refPath = url.resolve(shouldResolveOnCwd ? url.cwd() : path, $ref.$ref);

  const cache = dereferencedCache.get($refPath);
  if (cache) {
    const refKeys = Object.keys($ref);
    if (refKeys.length > 1) {
      const extraKeys = {};
      for (const key of refKeys) {
        if (key !== "$ref" && !(key in cache.value)) {
          // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          extraKeys[key] = $ref[key];
        }
      }
      return {
        circular: cache.circular,
        value: Object.assign({}, cache.value, extraKeys),
      };
    }

    return cache;
  }

  const pointer = $refs._resolve($refPath, path, options);

  if (pointer === null) {
    return {
      circular: false,
      value: null,
    };
  }

  // Check for circular references
  const directCircular = pointer.circular;
  let circular = directCircular || parents.has(pointer.value);
  circular && foundCircularReference(path, $refs, options);

  // Dereference the JSON reference
  let dereferencedValue = $Ref.dereference($ref, pointer.value);

  // Crawl the dereferenced value (unless it's circular)
  if (!circular) {
    // Determine if the dereferenced value is circular
    const dereferenced = crawl(
      dereferencedValue,
      pointer.path,
      pathFromRoot,
      parents,
      processedObjects,
      dereferencedCache,
      $refs,
      options,
    );
    circular = dereferenced.circular;
    dereferencedValue = dereferenced.value;
  }

  if (circular && !directCircular && options.dereference.circular === "ignore") {
    // The user has chosen to "ignore" circular references, so don't change the value
    dereferencedValue = $ref;
  }

  if (directCircular) {
    // The pointer is a DIRECT circular reference (i.e. it references itself).
    // So replace the $ref path with the absolute path from the JSON Schema root
    dereferencedValue.$ref = pathFromRoot;
  }

  const dereferencedObject = {
    circular,
    value: dereferencedValue,
  };

  // only cache if no extra properties than $ref
  if (Object.keys($ref).length === 1) {
    dereferencedCache.set($refPath, dereferencedObject);
  }

  return dereferencedObject;
}

/**
 * Called when a circular reference is found.
 * It sets the {@link $Refs#circular} flag, and throws an error if options.dereference.circular is false.
 *
 * @param keyPath - The JSON Reference path of the circular reference
 * @param $refs
 * @param options
 * @returns - always returns true, to indicate that a circular reference was found
 */
function foundCircularReference(keyPath: any, $refs: any, options: any) {
  $refs.circular = true;
  if (!options.dereference.circular) {
    throw ono.reference(`Circular $ref pointer found at ${keyPath}`);
  }
  return true;
}
