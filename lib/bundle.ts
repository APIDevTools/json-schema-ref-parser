import $Ref from "./ref.js";
import Pointer from "./pointer.js";
import * as url from "./util/url.js";
import { getSchemaBasePath, getSchemaId, getSchemaIdMode } from "./util/schema-resources.js";
import type $Refs from "./refs.js";
import type $RefParser from "./index.js";
import type { ParserOptions } from "./index.js";
import type { JSONSchema } from "./index.js";
import type { BundleOptions } from "./options.js";

export interface InventoryEntry {
  $ref: any;
  parent: any;
  key: any;
  pathFromRoot: any;
  depth: any;
  file: any;
  hash: any;
  value: any;
  circular: any;
  extended: any;
  external: any;
  nestedResource: boolean;
  indirections: any;
  scopeBase: string;
  dynamicIdScope: boolean;
  nestedIdScope: boolean;
  targetResourceBase: string;
  targetResourceId?: string;
}
/**
 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
 * only has *internal* references, not any *external* references.
 * This method mutates the JSON schema object, adding new references and re-mapping existing ones.
 *
 * @param parser
 * @param options
 */
function bundle<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  parser: $RefParser<S, O>,
  options: O,
) {
  // console.log('Bundling $ref pointers in %s', parser.$refs._root$Ref.path);
  const rootScopeBase = parser.$refs._root$Ref.dynamicIdScope
    ? getSchemaBasePath(parser.$refs._root$Ref.path!, parser.schema, parser.$refs._root$Ref.legacyIdScope)
    : parser.$refs._root$Ref.path!;

  // Build an inventory of all $ref pointers in the JSON Schema
  const inventory: InventoryEntry[] = [];
  const embeddedResourcePaths = new Set([url.stripHash(parser.$refs._root$Ref.path!), url.stripHash(rootScopeBase)]);
  crawl<S, O>(
    parser,
    "schema",
    parser.$refs._root$Ref.path + "#",
    rootScopeBase,
    parser.$refs._root$Ref.dynamicIdScope,
    parser.$refs._root$Ref.legacyIdScope,
    false,
    "#",
    0,
    inventory,
    parser.$refs,
    options,
    embeddedResourcePaths,
    new Set(),
  );

  // Get the root schema's $id (if any) for qualifying refs inside sub-schemas with their own $id
  const rootId = getSchemaId(parser.schema, parser.$refs._root$Ref.legacyIdScope);

  // Remap all $ref pointers
  remap<S, O>(inventory, options, rootId, rootScopeBase);

  // Fix any $ref paths that traverse through other $refs (which is invalid per JSON Schema spec)
  const bundleOptions = (options.bundle || {}) as BundleOptions;
  if (bundleOptions.optimizeInternalRefs !== false) {
    fixRefsThroughRefs(inventory, parser.schema as any);
  }
}

/**
 * Recursively crawls the given value, and inventories all JSON references.
 *
 * @param parent - The object containing the value to crawl. If the value is not an object or array, it will be ignored.
 * @param key - The property key of `parent` to be crawled
 * @param path - The full path of the property being crawled, possibly with a JSON Pointer in the hash
 * @param pathFromRoot - The path of the property being crawled, from the schema root
 * @param indirections
 * @param inventory - An array of already-inventoried $ref pointers
 * @param $refs
 * @param options
 */
function crawl<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  parent: object | $RefParser<S, O>,
  key: string | null,
  path: string,
  scopeBase: string,
  dynamicIdScope: boolean,
  legacyIdScope: boolean,
  nestedIdScope: boolean,
  pathFromRoot: string,
  indirections: number,
  inventory: InventoryEntry[],
  $refs: $Refs<S, O>,
  options: O,
  embeddedResourcePaths: Set<string>,
  seen: Set<object>,
) {
  const obj = key === null ? parent : parent[key as keyof typeof parent];
  const bundleOptions = (options.bundle || {}) as BundleOptions;
  const isExcludedPath = bundleOptions.excludedPathMatcher || (() => false);

  if (
    obj &&
    typeof obj === "object" &&
    !ArrayBuffer.isView(obj) &&
    !isExcludedPath(pathFromRoot, obj) &&
    !seen.has(obj)
  ) {
    // Input schemas are normally JSON trees, but callers can pass pre-circular
    // JavaScript objects. Tracking identities keeps those cycles intact without
    // recursively walking them until the call stack overflows. It also avoids
    // repeatedly inventorying shared object instances.
    seen.add(obj);

    const currentScopeBase = scopeBase;
    if ($Ref.isAllowed$Ref(obj, options)) {
      inventory$Ref(
        parent,
        key,
        path,
        currentScopeBase,
        dynamicIdScope,
        nestedIdScope,
        pathFromRoot,
        indirections,
        inventory,
        $refs,
        options,
        embeddedResourcePaths,
        seen,
      );
    } else {
      // Crawl the object in a specific order that's optimized for bundling.
      // This is important because it determines how `pathFromRoot` gets built,
      // which later determines which keys get dereferenced and which ones get remapped
      const keys = Object.keys(obj).sort((a, b) => {
        // Most people will expect references to be bundled into the the "definitions" property,
        // so we always crawl that property first, if it exists.
        if (a === "definitions" || a === "$defs") {
          return -1;
        } else if (b === "definitions" || b === "$defs") {
          return 1;
        } else {
          // Otherwise, crawl the keys based on their length.
          // This produces the shortest possible bundled references
          return a.length - b.length;
        }
      }) as (keyof typeof obj)[];

      for (const key of keys) {
        const keyPath = Pointer.join(path, key);
        const keyPathFromRoot = Pointer.join(pathFromRoot, key);

        const value = obj[key];
        if (isExcludedPath(keyPathFromRoot, value)) {
          continue;
        }
        const childLegacyIdScope = getSchemaIdMode(value, legacyIdScope);
        const childScopeBase =
          dynamicIdScope && value && typeof value === "object" && !ArrayBuffer.isView(value)
            ? getSchemaBasePath(currentScopeBase, value, childLegacyIdScope)
            : currentScopeBase;
        const childHasSchemaIdentifier = dynamicIdScope && hasSchemaIdentifier(value, childLegacyIdScope);
        const childNestedIdScope = nestedIdScope || childHasSchemaIdentifier;
        let childEmbeddedResourcePaths = embeddedResourcePaths;
        if (childHasSchemaIdentifier) {
          childEmbeddedResourcePaths = new Set(embeddedResourcePaths);
          childEmbeddedResourcePaths.add(url.stripHash(childScopeBase));
        }

        if ($Ref.isAllowed$Ref(value, options)) {
          inventory$Ref(
            obj,
            key,
            keyPath,
            childScopeBase,
            dynamicIdScope,
            childNestedIdScope,
            keyPathFromRoot,
            indirections,
            inventory,
            $refs,
            options,
            childEmbeddedResourcePaths,
            seen,
          );
        } else {
          crawl(
            obj,
            key,
            keyPath,
            childScopeBase,
            dynamicIdScope,
            childLegacyIdScope,
            childNestedIdScope,
            keyPathFromRoot,
            indirections,
            inventory,
            $refs,
            options,
            childEmbeddedResourcePaths,
            seen,
          );
        }

        // We need to ensure that we have an object to work with here because we may be crawling
        // an `examples` schema and `value` may be nullish.
        if (value && typeof value === "object" && !Array.isArray(value)) {
          if ("$ref" in value) {
            bundleOptions?.onBundle?.(value["$ref"], obj[key], obj as any, key);
          }
        }
      }
    }
  }
}

/**
 * Inventories the given JSON Reference (i.e. records detailed information about it so we can
 * optimize all $refs in the schema), and then crawls the resolved value.
 *
 * @param $refParent - The object that contains a JSON Reference as one of its keys
 * @param $refKey - The key in `$refParent` that is a JSON Reference
 * @param path - The full path of the JSON Reference at `$refKey`, possibly with a JSON Pointer in the hash
 * @param indirections - unknown
 * @param pathFromRoot - The path of the JSON Reference at `$refKey`, from the schema root
 * @param inventory - An array of already-inventoried $ref pointers
 * @param $refs
 * @param options
 */
function inventory$Ref<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  $refParent: any,
  $refKey: string | null,
  path: string,
  scopeBase: string,
  dynamicIdScope: boolean,
  nestedIdScope: boolean,
  pathFromRoot: string,
  indirections: number,
  inventory: InventoryEntry[],
  $refs: $Refs<S, O>,
  options: O,
  embeddedResourcePaths: Set<string>,
  seen: Set<object>,
) {
  const $ref = $refKey === null ? $refParent : $refParent[$refKey];
  const shouldResolveOnCwd = $Ref.isExternal$Ref($ref) && options.dereference?.externalReferenceResolution === "root";
  const resolutionBase = shouldResolveOnCwd ? url.cwd() : dynamicIdScope ? scopeBase : path;
  const $refPath = url.resolve(resolutionBase, $ref.$ref);
  const pointer = $refs._resolve($refPath, pathFromRoot, options);
  if (pointer === null) {
    return;
  }
  const parsed = Pointer.parse(pathFromRoot);
  const depth = parsed.length;
  const file = url.stripHash(pointer.path);
  const hash = url.getHash(pointer.path);
  const alias = $refs._aliases[file];
  const aliasIsInRootSchema = Boolean(alias && containsObject($refs._root$Ref.value, pointer.$ref.value));
  const external = file !== $refs._root$Ref.path && !embeddedResourcePaths.has(file) && !aliasIsInRootSchema;
  const nestedResource = Boolean(alias) && pointer.$ref.value !== $refs._root$Ref.value;
  const targetResourceId = getSchemaId(pointer.$ref.value, pointer.$ref.legacyIdScope);
  const targetResourceBase = alias
    ? pointer.$ref.path!
    : pointer.$ref.dynamicIdScope
      ? getSchemaBasePath(pointer.$ref.path!, pointer.$ref.value, pointer.$ref.legacyIdScope)
      : pointer.$ref.path!;
  const extended = $Ref.isExtended$Ref($ref);
  indirections += pointer.indirections;

  const existingEntry = findInInventory(inventory, $refParent, $refKey);
  if (existingEntry) {
    // This $Ref has already been inventoried, so we don't need to process it again
    if (depth < existingEntry.depth || indirections < existingEntry.indirections) {
      removeFromInventory(inventory, existingEntry);
    } else {
      return;
    }
  }

  inventory.push({
    $ref, // The JSON Reference (e.g. {$ref: string})
    parent: $refParent, // The object that contains this $ref pointer
    key: $refKey, // The key in `parent` that is the $ref pointer
    pathFromRoot, // The path to the $ref pointer, from the JSON Schema root
    depth, // How far from the JSON Schema root is this $ref pointer?
    file, // The file that the $ref pointer resolves to
    hash, // The hash within `file` that the $ref pointer resolves to
    value: pointer.value, // The resolved value of the $ref pointer
    circular: pointer.circular, // Is this $ref pointer DIRECTLY circular? (i.e. it references itself)
    extended, // Does this $ref extend its resolved value? (i.e. it has extra properties, in addition to "$ref")
    external, // Does this $ref pointer point to a file other than the main JSON Schema file?
    nestedResource, // Does this $ref resolve to an embedded schema resource with its own $id?
    indirections, // The number of indirect references that were traversed to resolve the value
    scopeBase, // The active schema-resource base at the location of this $ref
    dynamicIdScope, // Whether this $ref uses nested JSON Schema $id scopes
    nestedIdScope, // Whether this $ref will remain inside a non-root $id scope after bundling
    targetResourceBase, // The canonical URI of the resource containing the target
    ...(targetResourceId === undefined ? {} : { targetResourceId }),
  });

  // Recursively crawl the resolved value
  if (!existingEntry || external) {
    const resolvedScopeBase = pointer.$ref.dynamicIdScope ? pointer.scopeBase : pointer.$ref.path!;
    const resolvedNestedIdScope =
      nestedIdScope || (pointer.$ref.dynamicIdScope && hasSchemaIdentifier(pointer.value, pointer.legacyIdScope));
    const resolvedEmbeddedResourcePaths = new Set(embeddedResourcePaths);
    if (pointer.value === pointer.$ref.value && hasSchemaIdentifier(pointer.$ref.value, pointer.$ref.legacyIdScope)) {
      resolvedEmbeddedResourcePaths.add(url.stripHash(pointer.$ref.path!));
      resolvedEmbeddedResourcePaths.add(url.stripHash(resolvedScopeBase));
    }
    crawl(
      pointer.value,
      null,
      pointer.path,
      resolvedScopeBase,
      pointer.$ref.dynamicIdScope,
      pointer.legacyIdScope,
      resolvedNestedIdScope,
      pathFromRoot,
      indirections + 1,
      inventory,
      $refs,
      options,
      resolvedEmbeddedResourcePaths,
      seen,
    );
  }
}

/**
 * Re-maps every $ref pointer, so that they're all relative to the root of the JSON Schema.
 * Each referenced value is dereferenced EXACTLY ONCE.  All subsequent references to the same
 * value are re-mapped to point to the first reference.
 *
 * @example: {
 *    first: { $ref: somefile.json#/some/part },
 *    second: { $ref: somefile.json#/another/part },
 *    third: { $ref: somefile.json },
 *    fourth: { $ref: somefile.json#/some/part/sub/part }
 *  }
 *
 * In this example, there are four references to the same file, but since the third reference points
 * to the ENTIRE file, that's the only one we need to dereference.  The other three can just be
 * remapped to point inside the third one.
 *
 * On the other hand, if the third reference DIDN'T exist, then the first and second would both need
 * to be dereferenced, since they point to different parts of the file. The fourth reference does NOT
 * need to be dereferenced, because it can be remapped to point inside the first one.
 *
 * @param inventory
 */
function remap<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  inventory: InventoryEntry[],
  options: O,
  rootId?: string,
  rootScopeBase?: string,
) {
  // Group & sort all the $ref pointers, so they're in the order that we need to dereference/remap them
  inventory.sort((a: InventoryEntry, b: InventoryEntry) => {
    if (a.file !== b.file) {
      // Group all the $refs that point to the same file
      return a.file < b.file ? -1 : +1;
    } else if (a.hash !== b.hash) {
      // Group all the $refs that point to the same part of the file
      return a.hash < b.hash ? -1 : +1;
    } else if (a.circular !== b.circular) {
      // If the $ref points to itself, then sort it higher than other $refs that point to this $ref
      return a.circular ? -1 : +1;
    } else if (a.extended !== b.extended) {
      // If the $ref extends the resolved value, then sort it lower than other $refs that don't extend the value
      return a.extended ? +1 : -1;
    } else if (a.indirections !== b.indirections) {
      // Sort direct references higher than indirect references
      return a.indirections - b.indirections;
    } else if (a.depth !== b.depth) {
      // Sort $refs by how close they are to the JSON Schema root
      return a.depth - b.depth;
    } else {
      // Determine how far each $ref is from the "definitions" property.
      // Most people will expect references to be bundled into the the "definitions" property if possible.
      const aDefinitionsIndex = Math.max(
        a.pathFromRoot.lastIndexOf("/definitions"),
        a.pathFromRoot.lastIndexOf("/$defs"),
      );
      const bDefinitionsIndex = Math.max(
        b.pathFromRoot.lastIndexOf("/definitions"),
        b.pathFromRoot.lastIndexOf("/$defs"),
      );

      if (aDefinitionsIndex !== bDefinitionsIndex) {
        // Give higher priority to the $ref that's closer to the "definitions" property
        return bDefinitionsIndex - aDefinitionsIndex;
      } else {
        // All else is equal, so use the shorter path, which will produce the shortest possible reference
        return a.pathFromRoot.length - b.pathFromRoot.length;
      }
    }
  });

  let file, hash, pathFromRoot;
  for (const entry of inventory) {
    // console.log('Re-mapping $ref pointer "%s" at %s', entry.$ref.$ref, entry.pathFromRoot);

    const bundleOpts = (options.bundle || {}) as BundleOptions;
    if (!entry.external) {
      // This $ref already resolves to the main JSON Schema file.
      // When optimizeInternalRefs is false, preserve the original internal ref path
      // instead of rewriting it to the fully resolved hash. References to nested
      // resources must also retain their resource URI so that "#" does not point
      // at the document root instead.
      if (bundleOpts.optimizeInternalRefs !== false) {
        const targetResourceBase = url.stripHash(entry.targetResourceBase);
        const locationResourceBase = url.stripHash(entry.scopeBase);
        if (targetResourceBase !== locationResourceBase) {
          entry.$ref.$ref = referenceToResource(entry);
        } else if (!entry.nestedResource) {
          entry.$ref.$ref = entry.hash;
        }
      }
    } else if (entry.file === file && entry.hash === hash) {
      // This $ref points to the same value as the previous $ref, so remap it to the same path
      entry.$ref.$ref = qualifyPathFromRoot(entry, pathFromRoot, rootId, rootScopeBase);
    } else if (entry.file === file && entry.hash.indexOf(hash + "/") === 0) {
      // This $ref points to a sub-value of the previous $ref, so remap it beneath that path
      const subPath = Pointer.join(pathFromRoot, Pointer.parse(entry.hash.replace(hash, "#")));
      entry.$ref.$ref = qualifyPathFromRoot(entry, subPath, rootId, rootScopeBase);
    } else {
      // We've moved to a new file or new hash
      file = entry.file;
      hash = entry.hash;
      pathFromRoot = entry.pathFromRoot;

      // This is the first $ref to point to this value, so dereference the value.
      // Any other $refs that point to the same value will point to this $ref instead
      entry.$ref = entry.parent[entry.key] = $Ref.dereference(entry.$ref, entry.value, options);

      if (entry.circular) {
        // This $ref points to itself
        entry.$ref.$ref = entry.pathFromRoot;
      }
    }
  }

  // we want to ensure that any $refs that point to another $ref are remapped to point to the final value
  // let hadChange = true;
  // while (hadChange) {
  //   hadChange = false;
  //   for (const entry of inventory) {
  //     if (entry.$ref && typeof entry.$ref === "object" && "$ref" in entry.$ref) {
  //       const resolved = inventory.find((e: InventoryEntry) => e.pathFromRoot === entry.$ref.$ref);
  //       if (resolved) {
  //         const resolvedPointsToAnotherRef =
  //           resolved.$ref && typeof resolved.$ref === "object" && "$ref" in resolved.$ref;
  //         if (resolvedPointsToAnotherRef && entry.$ref.$ref !== resolved.$ref.$ref) {
  //           // console.log('Re-mapping $ref pointer "%s" at %s', entry.$ref.$ref, entry.pathFromRoot);
  //           entry.$ref.$ref = resolved.$ref.$ref;
  //           hadChange = true;
  //         }
  //       }
  //     }
  //   }
  // }
}

/**
 * TODO
 */
function findInInventory(inventory: InventoryEntry[], $refParent: any, $refKey: any) {
  for (const existingEntry of inventory) {
    if (existingEntry && existingEntry.parent === $refParent && existingEntry.key === $refKey) {
      return existingEntry;
    }
  }
  return undefined;
}

function removeFromInventory(inventory: InventoryEntry[], entry: any) {
  const index = inventory.indexOf(entry);
  inventory.splice(index, 1);
}

/**
 * After remapping, some $ref paths may traverse through other $ref nodes.
 * JSON pointer resolution does not follow $ref indirection, so these paths are invalid.
 * This function detects and fixes such paths by following any intermediate $refs
 * to compute a valid direct path.
 */
function fixRefsThroughRefs(inventory: InventoryEntry[], schema: any) {
  for (const entry of inventory) {
    if (!entry.$ref || typeof entry.$ref !== "object" || !("$ref" in entry.$ref)) {
      continue;
    }

    const refValue = entry.$ref.$ref;
    if (typeof refValue !== "string" || !refValue.startsWith("#/")) {
      continue;
    }

    const fixedPath = resolvePathThroughRefs(schema, refValue);
    if (fixedPath !== refValue) {
      entry.$ref.$ref = fixedPath;
    }
  }
}

/**
 * Walks a JSON pointer path through the schema. If any intermediate value
 * is a $ref, follows it and adjusts the path accordingly.
 * Returns the corrected path that doesn't traverse through any $ref.
 */
function resolvePathThroughRefs(schema: any, refPath: string): string {
  if (!refPath.startsWith("#/")) {
    return refPath;
  }

  const segments = refPath.slice(2).split("/");
  let current = schema;
  const resolvedSegments: string[] = [];

  for (const seg of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      // Can't walk further, return original path
      return refPath;
    }

    const decoded = seg.replace(/~1/g, "/").replace(/~0/g, "~");

    // If the next token is an own sibling of an extended $ref, the pointer
    // addresses that sibling directly and must not be rewritten through the
    // $ref target. Only follow the $ref when the literal object has no such key.
    if (
      !Object.prototype.hasOwnProperty.call(current, decoded) &&
      "$ref" in current &&
      typeof current.$ref === "string" &&
      current.$ref.startsWith("#/")
    ) {
      // Follow the $ref and restart the path from its target
      const targetSegments = current.$ref.slice(2).split("/");
      resolvedSegments.length = 0;
      resolvedSegments.push(...targetSegments);
      current = walkPath(schema, current.$ref);
      if (current === null || current === undefined || typeof current !== "object") {
        return refPath;
      }
    }

    const idx = Array.isArray(current) ? parseInt(decoded) : decoded;
    current = current[idx];
    resolvedSegments.push(seg);
  }

  const result = "#/" + resolvedSegments.join("/");
  return result;
}

/**
 * Walks a JSON pointer path through a schema object, returning the value at that path.
 */
function walkPath(schema: any, path: string): any {
  if (!path.startsWith("#/")) {
    return undefined;
  }

  const segments = path.slice(2).split("/");
  let current = schema;

  for (const seg of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    const decoded = seg.replace(/~1/g, "/").replace(/~0/g, "~");
    const idx = Array.isArray(current) ? parseInt(decoded) : decoded;
    current = current[idx];
  }

  return current;
}

/**
 * Qualifies a root-relative JSON Pointer when it is emitted inside a nested schema resource.
 * A fragment-only reference there would resolve against the nested resource rather than the
 * bundled document root.
 */
function qualifyPathFromRoot(
  entry: InventoryEntry,
  pathFromRoot: string,
  rootId?: string,
  rootScopeBase?: string,
): string {
  if (!entry.dynamicIdScope || !entry.nestedIdScope || !rootScopeBase) {
    return pathFromRoot;
  }

  // A fragment-only reference inside a nested schema resource resolves against
  // that resource's $id. Point back to the root resource explicitly instead.
  // Prefer the root's declared $id when it resolves correctly from this scope;
  // otherwise use the canonical root resource URI.
  let rootResource = rootScopeBase;
  if (rootId && url.stripHash(url.resolve(entry.scopeBase, rootId)) === url.stripHash(rootScopeBase)) {
    rootResource = rootId;
  }

  return url.stripHash(rootResource) + pathFromRoot;
}

function referenceToResource(entry: InventoryEntry): string {
  let resourceReference = url.stripHash(entry.targetResourceBase);
  if (
    typeof entry.$ref.$ref === "string" &&
    url.stripHash(url.resolve(entry.scopeBase, entry.$ref.$ref)) === resourceReference
  ) {
    return entry.$ref.$ref;
  }
  if (
    entry.targetResourceId &&
    url.stripHash(url.resolve(entry.scopeBase, entry.targetResourceId)) === resourceReference
  ) {
    resourceReference = entry.targetResourceId;
  }

  return entry.hash === "#" ? resourceReference : resourceReference + entry.hash;
}

function hasSchemaIdentifier(value: unknown, legacyIdScope = false): boolean {
  return getSchemaId(value, legacyIdScope) !== undefined;
}

function containsObject(root: unknown, target: unknown): boolean {
  if (!target || typeof target !== "object") {
    return false;
  }

  const seen = new Set<object>();
  const visit = (value: unknown): boolean => {
    if (value === target) {
      return true;
    }
    if (!value || typeof value !== "object" || ArrayBuffer.isView(value) || seen.has(value)) {
      return false;
    }

    seen.add(value);
    return Object.keys(value).some((key) => visit((value as Record<string, unknown>)[key]));
  };

  return visit(root);
}

export default bundle;
