import $Ref from "./ref.js";
import type { ParserOptions } from "./options.js";
import Pointer from "./pointer.js";
import * as url from "./util/url.js";
import type $Refs from "./refs.js";
import type { $RefParser } from "./index";
import type { JSONSchema } from "./types/index.js";

const DEBUG_PERFORMANCE = process.env.DEBUG === "true" || (typeof globalThis !== 'undefined' && (globalThis as any).DEBUG_BUNDLE_PERFORMANCE === true);

const perf = {
  mark: (name: string) => DEBUG_PERFORMANCE && performance.mark(name),
  measure: (name: string, start: string, end: string) => DEBUG_PERFORMANCE && performance.measure(name, start, end),
  log: (message: string, ...args: any[]) => DEBUG_PERFORMANCE && console.log("[PERF] " + message, ...args),
  warn: (message: string, ...args: any[]) => DEBUG_PERFORMANCE && console.warn("[PERF] " + message, ...args)
};

export interface InventoryEntry {
  $ref: any;
  circular: any;
  depth: any;
  extended: any;
  external: any;
  file: any;
  hash: any;
  indirections: any;
  key: any;
  parent: any;
  pathFromRoot: any;
  value: any;
}

/**
 * Fast lookup using Map instead of linear search with deep equality
 */
const createInventoryLookup = () => {
  const lookup = new Map<string, InventoryEntry>();
  const objectIds = new WeakMap<object, string>(); // Use WeakMap to avoid polluting objects
  let idCounter = 0;
  let lookupCount = 0;
  let addCount = 0;
  
  const getObjectId = (obj: any) => {
    if (!objectIds.has(obj)) {
      objectIds.set(obj, `obj_${++idCounter}`);
    }
    return objectIds.get(obj)!;
  };
  
  const createInventoryKey = ($refParent: any, $refKey: any) => {
    // Use WeakMap-based lookup to avoid polluting the actual schema objects
    return `${getObjectId($refParent)}_${$refKey}`;
  };
  
  return {
    add: (entry: InventoryEntry) => {
      addCount++;
      const key = createInventoryKey(entry.parent, entry.key);
      lookup.set(key, entry);
      if (addCount % 100 === 0) {
        perf.log(`Inventory lookup: Added ${addCount} entries, map size: ${lookup.size}`);
      }
    },
    find: ($refParent: any, $refKey: any) => {
      lookupCount++;
      const key = createInventoryKey($refParent, $refKey);
      const result = lookup.get(key);
      if (lookupCount % 100 === 0) {
        perf.log(`Inventory lookup: ${lookupCount} lookups performed`);
      }
      return result;
    },
    remove: (entry: InventoryEntry) => {
      const key = createInventoryKey(entry.parent, entry.key);
      lookup.delete(key);
    },
    getStats: () => ({ lookupCount, addCount, mapSize: lookup.size })
  };
};

/**
 * Inventories the given JSON Reference (i.e. records detailed information about it so we can
 * optimize all $refs in the schema), and then crawls the resolved value.
 */
const inventory$Ref = <S extends object = JSONSchema>({
  $refKey,
  $refParent,
  $refs,
  indirections,
  inventory,
  inventoryLookup,
  options,
  path,
  pathFromRoot,
  visitedObjects = new WeakSet(),
  resolvedRefs = new Map(),
}: {
  /**
   * The key in `$refParent` that is a JSON Reference
   */
  $refKey: string | null;
  /**
   * The object that contains a JSON Reference as one of its keys
   */
  $refParent: any;
  $refs: $Refs<S>;
  /**
   * unknown
   */
  indirections: number;
  /**
   * An array of already-inventoried $ref pointers
   */
  inventory: Array<InventoryEntry>;
  /**
   * Fast lookup for inventory entries
   */
  inventoryLookup: ReturnType<typeof createInventoryLookup>;
  options: ParserOptions;
  /**
   * The full path of the JSON Reference at `$refKey`, possibly with a JSON Pointer in the hash
   */
  path: string;
  /**
   * The path of the JSON Reference at `$refKey`, from the schema root
   */
  pathFromRoot: string;
  /**
   * Set of already visited objects to avoid infinite loops and redundant processing
   */
  visitedObjects?: WeakSet<object>;
  /**
   * Cache for resolved $ref targets to avoid redundant resolution
   */
  resolvedRefs?: Map<string, any>;
}) => {
  perf.mark('inventory-ref-start');
  const $ref = $refKey === null ? $refParent : $refParent[$refKey];
  const $refPath = url.resolve(path, $ref.$ref);
  
  // Check cache first to avoid redundant resolution
  let pointer = resolvedRefs.get($refPath);
  if (!pointer) {
    perf.mark('resolve-start');
    pointer = $refs._resolve($refPath, pathFromRoot, options);
    perf.mark('resolve-end');
    perf.measure('resolve-time', 'resolve-start', 'resolve-end');
    
    if (pointer) {
      resolvedRefs.set($refPath, pointer);
      perf.log(`Cached resolved $ref: ${$refPath}`);
    }
  } 
  
  if (pointer === null) {
    perf.mark('inventory-ref-end');
    perf.measure('inventory-ref-time', 'inventory-ref-start', 'inventory-ref-end');
    return;
  }
  
  const parsed = Pointer.parse(pathFromRoot);
  const depth = parsed.length;
  const file = url.stripHash(pointer.path);
  const hash = url.getHash(pointer.path);
  const external = file !== $refs._root$Ref.path;
  const extended = $Ref.isExtended$Ref($ref);
  indirections += pointer.indirections;

  // Check if this exact location (parent + key + pathFromRoot) has already been inventoried
  perf.mark('lookup-start');
  const existingEntry = inventoryLookup.find($refParent, $refKey);
  perf.mark('lookup-end');
  perf.measure('lookup-time', 'lookup-start', 'lookup-end');
  
  if (existingEntry && existingEntry.pathFromRoot === pathFromRoot) {
    // This exact location has already been inventoried, so we don't need to process it again
    if (depth < existingEntry.depth || indirections < existingEntry.indirections) {
      removeFromInventory(inventory, existingEntry);
      inventoryLookup.remove(existingEntry);
    } else {
      perf.mark('inventory-ref-end');
      perf.measure('inventory-ref-time', 'inventory-ref-start', 'inventory-ref-end');
      return;
    }
  }

  const newEntry: InventoryEntry = {
    $ref, // The JSON Reference (e.g. {$ref: string})
    circular: pointer.circular, // Is this $ref pointer DIRECTLY circular? (i.e. it references itself)
    depth, // How far from the JSON Schema root is this $ref pointer?
    extended, // Does this $ref extend its resolved value? (i.e. it has extra properties, in addition to "$ref")
    external, // Does this $ref pointer point to a file other than the main JSON Schema file?
    file, // The file that the $ref pointer resolves to
    hash, // The hash within `file` that the $ref pointer resolves to
    indirections, // The number of indirect references that were traversed to resolve the value
    key: $refKey, // The key in `parent` that is the $ref pointer
    parent: $refParent, // The object that contains this $ref pointer
    pathFromRoot, // The path to the $ref pointer, from the JSON Schema root
    value: pointer.value, // The resolved value of the $ref pointer
  };

  inventory.push(newEntry);
  inventoryLookup.add(newEntry);

  perf.log(`Inventoried $ref: ${$ref.$ref} -> ${file}${hash} (external: ${external}, depth: ${depth})`);

  // Recursively crawl the resolved value
  if (!existingEntry || external) {
    perf.mark('crawl-recursive-start');
    crawl({
      parent: pointer.value,
      key: null,
      path: pointer.path,
      pathFromRoot,
      indirections: indirections + 1,
      inventory,
      inventoryLookup,
      $refs,
      options,
      visitedObjects,
      resolvedRefs,
    });
    perf.mark('crawl-recursive-end');
    perf.measure('crawl-recursive-time', 'crawl-recursive-start', 'crawl-recursive-end');
  }
  
  perf.mark('inventory-ref-end');
  perf.measure('inventory-ref-time', 'inventory-ref-start', 'inventory-ref-end');
};

/**
 * Recursively crawls the given value, and inventories all JSON references.
 */
const crawl = <S extends object = JSONSchema>({
  $refs,
  indirections,
  inventory,
  inventoryLookup,
  key,
  options,
  parent,
  path,
  pathFromRoot,
  visitedObjects = new WeakSet(),
  resolvedRefs = new Map(),
}: {
  $refs: $Refs<S>;
  indirections: number;
  /**
   * An array of already-inventoried $ref pointers
   */
  inventory: Array<InventoryEntry>;
  /**
   * Fast lookup for inventory entries
   */
  inventoryLookup: ReturnType<typeof createInventoryLookup>;
  /**
   * The property key of `parent` to be crawled
   */
  key: string | null;
  options: ParserOptions;
  /**
   * The object containing the value to crawl. If the value is not an object or array, it will be ignored.
   */
  parent: object | $RefParser;
  /**
   * The full path of the property being crawled, possibly with a JSON Pointer in the hash
   */
  path: string;
  /**
   * The path of the property being crawled, from the schema root
   */
  pathFromRoot: string;
  /**
   * Set of already visited objects to avoid infinite loops and redundant processing
   */
  visitedObjects?: WeakSet<object>;
  /**
   * Cache for resolved $ref targets to avoid redundant resolution
   */
  resolvedRefs?: Map<string, any>;
}) => {
  const obj = key === null ? parent : parent[key as keyof typeof parent];

  if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj)) {
    // Early exit if we've already processed this exact object
    if (visitedObjects.has(obj)) {
      perf.log(`Skipping already visited object at ${pathFromRoot}`);
      return;
    }
    
    if ($Ref.isAllowed$Ref(obj)) {
      perf.log(`Found $ref at ${pathFromRoot}: ${(obj as any).$ref}`);
      inventory$Ref({
        $refParent: parent,
        $refKey: key,
        path,
        pathFromRoot,
        indirections,
        inventory,
        inventoryLookup,
        $refs,
        options,
        visitedObjects,
        resolvedRefs,
      });
    } else {
      // Mark this object as visited BEFORE processing its children
      visitedObjects.add(obj);
      
      // Crawl the object in a specific order that's optimized for bundling.
      // This is important because it determines how `pathFromRoot` gets built,
      // which later determines which keys get dereferenced and which ones get remapped
      const keys = Object.keys(obj).sort((a, b) => {
        // Most people will expect references to be bundled into the "definitions" property,
        // so we always crawl that property first, if it exists.
        if (a === "definitions") {
          return -1;
        } else if (b === "definitions") {
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

        if ($Ref.isAllowed$Ref(value)) {
          inventory$Ref({
            $refParent: obj,
            $refKey: key,
            path,
            pathFromRoot: keyPathFromRoot,
            indirections,
            inventory,
            inventoryLookup,
            $refs,
            options,
            visitedObjects,
            resolvedRefs,
          });
        } else {
          crawl({
            parent: obj,
            key,
            path: keyPath,
            pathFromRoot: keyPathFromRoot,
            indirections,
            inventory,
            inventoryLookup,
            $refs,
            options,
            visitedObjects,
            resolvedRefs,
          });
        }
      }
    }
  }
};

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
function remap(inventory: InventoryEntry[]) {
  perf.log(`Starting remap with ${inventory.length} inventory entries`);
  perf.mark('remap-start');
  
  // Group & sort all the $ref pointers, so they're in the order that we need to dereference/remap them
  perf.mark('sort-inventory-start');
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
      const aDefinitionsIndex = a.pathFromRoot.lastIndexOf("/definitions");
      const bDefinitionsIndex = b.pathFromRoot.lastIndexOf("/definitions");

      if (aDefinitionsIndex !== bDefinitionsIndex) {
        // Give higher priority to the $ref that's closer to the "definitions" property
        return bDefinitionsIndex - aDefinitionsIndex;
      } else {
        // All else is equal, so use the shorter path, which will produce the shortest possible reference
        return a.pathFromRoot.length - b.pathFromRoot.length;
      }
    }
  });
  perf.mark('sort-inventory-end');
  perf.measure('sort-inventory-time', 'sort-inventory-start', 'sort-inventory-end');
  
  perf.log(`Sorted ${inventory.length} inventory entries`);

  let file, hash, pathFromRoot;

  perf.mark('remap-loop-start');
  for (const entry of inventory) {
    
    // Safety check: ensure entry and entry.$ref are valid objects
    if (!entry || !entry.$ref || typeof entry.$ref !== 'object') {
      perf.warn(`Skipping invalid inventory entry:`, entry);
      continue;
    }
    
    if (!entry.external && !entry.hash?.startsWith("#/paths/")) {
      // This $ref already resolves to the main JSON Schema file
      entry.$ref.$ref = entry.hash;
    } else if (entry.file === file && entry.hash === hash) {
      // This $ref points to the same value as the prevous $ref, so remap it to the same path
      entry.$ref.$ref = pathFromRoot;
    } else if (entry.file === file && entry.hash.indexOf(hash + "/") === 0) {
      // This $ref points to a sub-value of the prevous $ref, so remap it beneath that path
      entry.$ref.$ref = Pointer.join(pathFromRoot, Pointer.parse(entry.hash.replace(hash, "#")));
    } else {
      // We've moved to a new file or new hash
      file = entry.file;
      hash = entry.hash;
      pathFromRoot = entry.pathFromRoot;

      // This is the first $ref to point to this value, so dereference the value.
      // Any other $refs that point to the same value will point to this $ref instead
      
      // Safety check: ensure parent and key are valid before assignment
      if (entry.parent && entry.key !== null && entry.key !== undefined) {
        try {
          perf.mark('dereference-start');
          // Use the original bundling logic: dereference and assign
          entry.$ref = entry.parent[entry.key] = $Ref.dereference(entry.$ref, entry.value);
          perf.mark('dereference-end');
          perf.measure('dereference-time', 'dereference-start', 'dereference-end');
        } catch (error) {
          perf.warn(`Error during dereference:`, error);
          perf.warn(`Entry details:`, { 
            $ref: entry.$ref, 
            value: entry.value, 
            pathFromRoot: entry.pathFromRoot 
          });
          // Skip this entry on error
          continue;
        }
      } else {
        perf.warn(`Skipping dereference for invalid parent/key:`, { parent: !!entry.parent, key: entry.key });
        continue;
      }

      if (entry.circular) {
        // This $ref points to itself
        if (typeof entry.$ref === 'object' && entry.$ref && '$ref' in entry.$ref) {
          entry.$ref.$ref = entry.pathFromRoot;
        }
      }
    }
  }
  perf.mark('remap-loop-end');
  perf.measure('remap-loop-time', 'remap-loop-start', 'remap-loop-end');
  
  perf.mark('remap-end');
  perf.measure('remap-total-time', 'remap-start', 'remap-end');
  
  perf.log(`Completed remap of ${inventory.length} entries`);

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

function removeFromInventory(inventory: InventoryEntry[], entry: any) {
  const index = inventory.indexOf(entry);
  inventory.splice(index, 1);
}

/**
 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
 * only has *internal* references, not any *external* references.
 * This method mutates the JSON schema object, adding new references and re-mapping existing ones.
 *
 * @param parser
 * @param options
 */
export const bundle = (parser: $RefParser, options: ParserOptions) => {
  console.log('Bundling $ref pointers in %s', parser.$refs._root$Ref.path);
  perf.mark('bundle-start');
  
  // Build an inventory of all $ref pointers in the JSON Schema
  const inventory: InventoryEntry[] = [];
  const inventoryLookup = createInventoryLookup();
  
  perf.log('Starting crawl phase');
  perf.mark('crawl-phase-start');
  
  const visitedObjects = new WeakSet<object>();
  const resolvedRefs = new Map<string, any>(); // Cache for resolved $ref targets
  
  crawl<JSONSchema>({
    parent: parser,
    key: "schema",
    path: parser.$refs._root$Ref.path + "#",
    pathFromRoot: "#",
    indirections: 0,
    inventory,
    inventoryLookup,
    $refs: parser.$refs,
    options,
    visitedObjects,
    resolvedRefs,
  });

  perf.mark('crawl-phase-end');
  perf.measure('crawl-phase-time', 'crawl-phase-start', 'crawl-phase-end');
  
  const stats = inventoryLookup.getStats();
  perf.log(`Crawl phase complete. Found ${inventory.length} $refs. Lookup stats:`, stats);

  // Remap all $ref pointers
  perf.log('Starting remap phase');
  perf.mark('remap-phase-start');
  remap(inventory);
  perf.mark('remap-phase-end');
  perf.measure('remap-phase-time', 'remap-phase-start', 'remap-phase-end');
  
  perf.mark('bundle-end');
  perf.measure('bundle-total-time', 'bundle-start', 'bundle-end');
  
  perf.log('Bundle complete. Performance summary:');
  
  // Log final stats
  const finalStats = inventoryLookup.getStats();
  perf.log(`Final inventory stats:`, finalStats);
  perf.log(`Resolved refs cache size: ${resolvedRefs.size}`);
  
  if (DEBUG_PERFORMANCE) {
    // Log all performance measures
    const measures = performance.getEntriesByType('measure');
    measures.forEach(measure => {
      if (measure.name.includes('time')) {
        console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`);
      }
    });
    
    // Clear performance marks and measures for next run
    performance.clearMarks();
    performance.clearMeasures();
  }
};
