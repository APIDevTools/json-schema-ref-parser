import $Ref from "./ref.js";
import Pointer from "./pointer.js";
import * as url from "./util/url.js";
import { getSchemaBasePath, getSchemaId, getSchemaIdMode } from "./util/schema-resources.js";
import type $Refs from "./refs.js";
import type $RefParser from "./index.js";
import type { ParserOptions } from "./index.js";
import type { JSONSchema } from "./index.js";
import type { BundleOptions } from "./options.js";
import { defaultBundleExcludedPathMatcher } from "./options.js";

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
  rootReference?: string;
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
  const generatedRefs = new Map<object, string>();
  remap<S, O>(inventory, options, generatedRefs, rootId, rootScopeBase);

  finalizeReferences(
    parser.schema,
    inventory,
    generatedRefs,
    rootScopeBase,
    parser.$refs._root$Ref.dynamicIdScope,
    parser.$refs._root$Ref.legacyIdScope,
    (options.bundle || {}) as BundleOptions,
  );
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
  matcherAlreadyChecked = false,
) {
  const obj = key === null ? parent : parent[key as keyof typeof parent];
  const bundleOptions = (options.bundle || {}) as BundleOptions;
  const isExcludedPath = bundleOptions.excludedPathMatcher || (() => false);

  if (
    obj &&
    typeof obj === "object" &&
    !ArrayBuffer.isView(obj) &&
    (matcherAlreadyChecked || !isExcludedPath(pathFromRoot, obj)) &&
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
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor?.get && isExcludedPath(keyPathFromRoot, undefined)) {
          continue;
        }

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
            true,
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
  const refFile = url.stripHash($refPath);
  const rootReference =
    refFile === $refs._root$Ref.path || $refs._aliases[refFile]?.value === $refs._root$Ref.value
      ? url.getHash($refPath)
      : undefined;
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
    ...(rootReference === undefined ? {} : { rootReference }),
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
  generatedRefs: Map<object, string>,
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
  const recursiveEntries: InventoryEntry[] = [];
  for (const entry of inventory) {
    // console.log('Re-mapping $ref pointer "%s" at %s', entry.$ref.$ref, entry.pathFromRoot);

    const bundleOpts = (options.bundle || {}) as BundleOptions;
    if (!entry.external) {
      // This $ref already resolves to the main JSON Schema file.
      // When optimizeInternalRefs is false, preserve the original internal ref path
      // instead of rewriting it to the fully resolved hash. References to nested
      // resources must also retain their resource URI so that "#" does not point
      // at the document root instead.
      if (
        entry.rootReference !== undefined &&
        !entry.nestedIdScope &&
        (bundleOpts.optimizeInternalRefs === false || !entry.nestedResource)
      ) {
        // An inlined file without its own $id now shares the root's scope.
        // Internalizing a reference back to that root is required even when
        // optimization is disabled; only collapsing its ref chain is optional.
        entry.$ref.$ref = bundleOpts.optimizeInternalRefs === false ? entry.rootReference : entry.hash;
      } else if (bundleOpts.optimizeInternalRefs !== false) {
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
      generatedRefs.set(entry.$ref, pathFromRoot);
    } else if (entry.file === file && entry.hash.indexOf(hash + "/") === 0) {
      // This $ref points to a sub-value of the previous $ref, so remap it beneath that path
      const tokens = Pointer.parse("#" + entry.hash.slice(hash.length));
      if (pathFromRoot?.startsWith(entry.pathFromRoot + "/")) {
        // The ancestor was embedded beneath this sub-value. Redirecting this
        // location into that ancestor would remove the very path it points to.
        entry.$ref = entry.parent[entry.key] = $Ref.dereference(entry.$ref, entry.value, options);
        recursiveEntries.push(entry);
      } else {
        const subPath = Pointer.join(pathFromRoot, tokens);
        entry.$ref.$ref = qualifyPathFromRoot(entry, subPath, rootId, rootScopeBase);
        generatedRefs.set(entry.$ref, subPath);
      }
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
        generatedRefs.set(entry.$ref, entry.pathFromRoot);
      }
    }
  }

  for (const entry of recursiveEntries) {
    // Finish other external inlines before copying this subtree, so writes to
    // inventoried parents are retained in the recursive bundle as well.
    preserveRecursiveTargets(entry, inventory, generatedRefs, rootId, rootScopeBase);
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
 * Replaces cycles introduced by recursive external sub-paths with internal references.
 * Copying keeps source values distinct from extended refs that override their properties.
 */
function preserveRecursiveTargets(
  entry: InventoryEntry,
  inventory: InventoryEntry[],
  generatedRefs: Map<object, string>,
  rootId?: string,
  rootScopeBase?: string,
) {
  const targets = new Set(inventory.map((candidate) => candidate.value));
  const paths = new Map<object, string>();
  const activeTargets = new Map<object, string>();
  const parents = new Map<object, { copy: any; targetCount: number }>();
  const refScopes = new Map<object, InventoryEntry>();

  function copy(value: any, path: string, scope: InventoryEntry, legacyIdScope = false): any {
    if (!value || typeof value !== "object" || ArrayBuffer.isView(value)) {
      return value;
    }
    const recursivePath = activeTargets.get(value);
    if (recursivePath !== undefined) {
      // Only reference targets can be replaced with $refs. Intermediate maps
      // such as "properties" must remain literal objects in the bundle.
      const ref = { $ref: qualifyPathFromRoot(scope, recursivePath, rootId, rootScopeBase) };
      generatedRefs.set(ref, recursivePath);
      return ref;
    }
    const parent = parents.get(value);
    if (parent && parent.targetCount === activeTargets.size) {
      // Preserve JavaScript object cycles that did not come from a $ref.
      return parent.copy;
    }
    legacyIdScope = getSchemaIdMode(value, legacyIdScope);
    if (hasSchemaIdentifier(value, legacyIdScope)) {
      scope = {
        ...scope,
        scopeBase: getSchemaBasePath(scope.scopeBase, value, legacyIdScope),
        dynamicIdScope: true,
        nestedIdScope: true,
      };
    }
    if (targets.has(value)) {
      if (!paths.has(value)) {
        paths.set(value, path);
      }
      activeTargets.set(value, path);
    }
    if ($Ref.is$Ref(value)) {
      // Retain inventoried ref identities so subsequent remapping reaches all
      // their copied occurrences, including refs with sibling properties.
      refScopes.set(value, scope);
      activeTargets.delete(value);
      return value;
    }
    const result = Array.isArray(value) ? new Array(value.length) : {};
    parents.set(value, { copy: result, targetCount: activeTargets.size });
    for (const key of Object.keys(value)) {
      Object.defineProperty(result, key, {
        value: copy(value[key], Pointer.join(path, key), scope, legacyIdScope),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    activeTargets.delete(value);
    if (parent) {
      parents.set(value, parent);
    } else {
      parents.delete(value);
    }
    return result;
  }

  entry.$ref = entry.parent[entry.key] = copy(entry.$ref, entry.pathFromRoot, {
    ...entry,
    scopeBase: entry.nestedIdScope ? entry.scopeBase : (rootScopeBase ?? entry.scopeBase),
  });

  // An extended ref can move the unmodified source deeper into the bundle.
  // Prefer the closest source target so refs never traverse a generated $ref,
  // including when optimizeInternalRefs is disabled.
  const relocated = inventory
    .filter((candidate) => paths.has(candidate.value))
    .sort((a, b) => b.hash.length - a.hash.length);
  for (const candidate of inventory) {
    if (!candidate.external || candidate.circular || !$Ref.is$Ref(candidate.$ref)) {
      continue;
    }
    const target = relocated.find(
      (target) =>
        target.file === candidate.file &&
        (target.hash === candidate.hash || candidate.hash.startsWith(target.hash + "/")),
    );
    if (target) {
      const path = Pointer.join(
        paths.get(target.value)!,
        Pointer.parse("#" + candidate.hash.slice(target.hash.length)),
      );
      candidate.$ref.$ref = qualifyPathFromRoot(
        refScopes.get(candidate.$ref) ?? candidate,
        path,
        rootId,
        rootScopeBase,
      );
      generatedRefs.set(candidate.$ref, path);
    }
  }
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
 * Locate references in the finished bundle, after recursive targets and external
 * schemas have moved. Generated targets inside the same resource can use local
 * pointers; authored references retain their spelling when optimization is off.
 */
function finalizeReferences(
  schema: any,
  inventory: InventoryEntry[],
  generatedRefs: Map<object, string>,
  rootScopeBase: string,
  dynamicIdScope: boolean,
  legacyIdScope: boolean,
  options: BundleOptions,
) {
  if (
    inventory.length === 0 ||
    (options.optimizeInternalRefs === false && (!dynamicIdScope || generatedRefs.size === 0))
  ) {
    return;
  }
  interface Resource {
    value: object;
    path: string;
  }
  const trackedRefs = new Set([...inventory.map((entry) => entry.$ref), ...generatedRefs.keys()]);
  const references: { value: any; resource: Resource }[] = [];
  const resourceRoots = new Map<object, object | undefined>();
  const parents = new Set<object>();
  const isExcludedPath = options.excludedPathMatcher || (() => false);
  const visited =
    !options.excludedPathMatcher || options.excludedPathMatcher === defaultBundleExcludedPathMatcher
      ? new Map<object, Set<string>>()
      : undefined;

  function visit(value: any, path: string, scopeBase: string, legacyId: boolean, resource: Resource) {
    if (!value || typeof value !== "object" || ArrayBuffer.isView(value) || parents.has(value)) {
      return;
    }
    legacyId = getSchemaIdMode(value, legacyId);
    if (dynamicIdScope && path !== "#") {
      const nextBase = getSchemaBasePath(scopeBase, value, legacyId);
      // A plain-name fragment identifies a subschema within the current
      // resource. It does not establish a new JSON Pointer root.
      if (url.stripHash(nextBase) !== url.stripHash(scopeBase)) {
        resource = { value, path };
      }
      scopeBase = nextBase;
    }
    if (visited) {
      const context = JSON.stringify([legacyId, scopeBase, resource.path]);
      const contexts = visited.get(value);
      if (contexts?.has(context)) {
        return;
      }
      if (contexts) {
        contexts.add(context);
      } else {
        visited.set(value, new Set([context]));
      }
    }
    parents.add(value);
    if (!resourceRoots.has(value)) {
      resourceRoots.set(value, resource.value);
    } else if (resourceRoots.get(value) !== resource.value) {
      resourceRoots.set(value, undefined);
    }
    if (trackedRefs.has(value) && typeof value.$ref === "string") {
      references.push({ value, resource });
    }
    for (const key of Object.keys(value)) {
      const childPath = Pointer.join(path, key);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor?.get && isExcludedPath(childPath, undefined)) {
        continue;
      }
      const child = value[key];
      if (!isExcludedPath(childPath, child)) {
        visit(child, childPath, scopeBase, legacyId, resource);
      }
    }
    parents.delete(value);
  }

  if (!isExcludedPath("#", schema)) {
    visit(schema, "#", rootScopeBase, legacyIdScope, { value: schema, path: "#" });
  }

  // A caller can share an object across resource scopes. Only mutate its ref
  // when every occurrence agrees on the rewrite.
  const rewrites = new Map<any, string | undefined>();
  function propose(value: any, ref: string) {
    if (!rewrites.has(value)) {
      rewrites.set(value, ref);
    } else if (rewrites.get(value) !== ref) {
      rewrites.set(value, undefined);
    }
  }
  function applyRewrites() {
    for (const [value, ref] of rewrites) {
      if (ref !== undefined && ref !== value.$ref) {
        value.$ref = ref;
      }
    }
    rewrites.clear();
  }

  if (dynamicIdScope) {
    for (const { value, resource } of references) {
      const target = generatedRefs.get(value);
      if (target === undefined) {
        continue;
      }
      const insideResource = target === resource.path || target.startsWith(resource.path + "/");
      propose(
        value,
        insideResource
          ? "#" + target.slice(resource.path.length)
          : value.$ref.startsWith("#")
            ? url.stripHash(rootScopeBase) + target
            : value.$ref,
      );
    }
    applyRewrites();
  }

  if (options.optimizeInternalRefs !== false) {
    for (const { value, resource } of references) {
      propose(value, resolvePathThroughRefs(resource.value, value.$ref, resourceRoots));
    }
    applyRewrites();
  }
}

/**
 * Walks a JSON pointer path through the schema. If any intermediate value
 * is a $ref, follows it and adjusts the path accordingly.
 * Returns the corrected path that doesn't traverse through any $ref.
 */
function resolvePathThroughRefs(schema: any, refPath: string, resourceRoots: Map<object, object | undefined>): string {
  if (!isInternalPointer(refPath)) {
    return refPath;
  }

  const segments = Pointer.parse(refPath);
  let current = schema;
  const resolvedSegments: string[] = [];

  for (const seg of segments) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object" ||
      resourceRoots.get(current) !== schema
    ) {
      // Do not follow a fragment reference after crossing into another resource.
      return refPath;
    }

    // If the next token is an own sibling of an extended $ref, the pointer
    // addresses that sibling directly and must not be rewritten through the
    // $ref target. Only follow the $ref when the literal object has no such key.
    if (
      !Object.prototype.hasOwnProperty.call(current, seg) &&
      "$ref" in current &&
      typeof current.$ref === "string" &&
      isInternalPointer(current.$ref)
    ) {
      // Follow the $ref and restart the path from its target
      const targetSegments = Pointer.parse(current.$ref);
      resolvedSegments.length = 0;
      resolvedSegments.push(...targetSegments);
      current = walkPath(schema, current.$ref, resourceRoots);
      if (current === null || current === undefined || typeof current !== "object") {
        return refPath;
      }
    }

    current = current[seg];
    resolvedSegments.push(seg);
  }

  return Pointer.join("#", resolvedSegments);
}

/**
 * Walks a JSON pointer path through a schema object, returning the value at that path.
 */
function walkPath(schema: any, path: string, resourceRoots: Map<object, object | undefined>): any {
  if (!isInternalPointer(path)) {
    return undefined;
  }

  const segments = Pointer.parse(path);
  let current = schema;

  for (const seg of segments) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object" ||
      resourceRoots.get(current) !== schema
    ) {
      return undefined;
    }
    current = current[seg];
  }

  return current;
}

function isInternalPointer(path: string): boolean {
  return path[0] === "#" && url.safeDecodeURIComponent(path.substring(1)).startsWith("/");
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
