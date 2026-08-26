import $Ref from "../ref.js";
import Pointer from "../pointer.js";
import parse from "../parse.js";
import * as url from "../util/url.js";
import { isHandledError } from "../util/errors.js";
import { getSchemaBasePath, getSchemaIdMode } from "../util/schema-resources.js";
import type $Refs from "../refs.js";
import type { ExcludedPathMatcher, ParserOptions } from "../options.js";
import type $RefParser from "../index.js";

interface LocatedValue {
  value: unknown;
  path: string;
  originPaths?: readonly string[];
  scopeBase: string;
  dynamicIdScope: boolean;
  legacyIdScope: boolean;
  children?: Map<string, LocatedValue | DeferredChild>;
  referenceLocation?: LocatedValue;
  owner?: LocatedValue;
  resolveMetadata?: () => void;
}

interface DeferredChild {
  resolve: () => LocatedValue;
  requiresPrecheck: boolean;
}

interface ObjectChain {
  value: object;
  parent?: ObjectChain;
}

interface ReferenceChain {
  path: string;
  depth: number;
  parent?: ReferenceChain;
}

interface MergeChain {
  target: object;
  source: object;
  value: LocatedValue;
  parent?: MergeChain;
}

interface ResolveContext<S extends object, O extends ParserOptions<S>> {
  $refs: $Refs<S, O>;
  options: O;
  excludedPathMatcher: ExcludedPathMatcher;
  documentLoads: Map<string, Promise<boolean>>;
  externalDocuments: Set<string>;
  excludedPaths: Set<string>;
  excludedAncestorPaths: Set<string>;
}

export default async function resolveExternalWithMatcher<S extends object, O extends ParserOptions<S>>(
  parser: $RefParser<S, O>,
  options: O,
  excludedPathMatcher: ExcludedPathMatcher,
) {
  const rootPath = parser.$refs._root$Ref.path!;
  const rootScopeBase = parser.$refs._root$Ref.dynamicIdScope
    ? getSchemaBasePath(rootPath, parser.schema, parser.$refs._root$Ref.legacyIdScope)
    : rootPath;
  const context: ResolveContext<S, O> = {
    $refs: parser.$refs,
    options,
    excludedPathMatcher,
    documentLoads: new Map(),
    externalDocuments: new Set(),
    excludedPaths: new Set(),
    excludedAncestorPaths: new Set(),
  };

  await crawlOccurrence(
    {
      value: parser.schema,
      path: rootPath + "#",
      originPaths: [rootPath + "#"],
      scopeBase: rootScopeBase,
      dynamicIdScope: parser.$refs._root$Ref.dynamicIdScope,
      legacyIdScope: parser.$refs._root$Ref.legacyIdScope,
    },
    "#",
    undefined,
    undefined,
    context,
  );
  await completeExternalDocumentInventory(context);
}

/** Crawls one logical occurrence, keeping its URI provenance separate from its root-relative path. */
async function crawlOccurrence<S extends object, O extends ParserOptions<S>>(
  occurrence: LocatedValue,
  pathFromRoot: string,
  activeObjects: ObjectChain | undefined,
  activeReferences: ReferenceChain | undefined,
  context: ResolveContext<S, O>,
  matcherAlreadyChecked = false,
): Promise<void> {
  if (!matcherAlreadyChecked && context.excludedPathMatcher(pathFromRoot, occurrence.value)) {
    markExcludedOrigins(occurrence, context);
    return;
  }

  const value = occurrence.value;
  if (!value || typeof value !== "object" || ArrayBuffer.isView(value) || hasObject(activeObjects, value)) {
    return;
  }
  ensureLocationMetadata(occurrence);

  const nextActiveObjects: ObjectChain = { value, ...(activeObjects ? { parent: activeObjects } : {}) };
  if ($Ref.is$Ref(value) && $Ref.isAllowed$Ref(value, context.options)) {
    const traversed = await crawlReferenceOccurrence(occurrence, pathFromRoot, activeReferences, context);
    if (!traversed && $Ref.isExtended$Ref(value)) {
      await crawlChildren(occurrence, pathFromRoot, nextActiveObjects, activeReferences, context);
    }
    return;
  }

  await crawlChildren(occurrence, pathFromRoot, nextActiveObjects, activeReferences, context);
}

async function crawlChildren<S extends object, O extends ParserOptions<S>>(
  occurrence: LocatedValue,
  pathFromRoot: string,
  activeObjects: ObjectChain,
  activeReferences: ReferenceChain | undefined,
  context: ResolveContext<S, O>,
) {
  const value = occurrence.value as Record<string, unknown>;
  await Promise.all(
    Object.keys(value)
      .filter((key) => key !== "$ref")
      .map(async (key) => {
        const childPathFromRoot = Pointer.join(pathFromRoot, key);
        if (occurrence.children) {
          if (requiresChildPrecheck(occurrence, key) && context.excludedPathMatcher(childPathFromRoot, undefined)) {
            markExcludedChildOrigins(occurrence, key, context);
            return;
          }
        } else {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          if (descriptor?.get && context.excludedPathMatcher(childPathFromRoot, undefined)) {
            markExcludedChildOrigins(occurrence, key, context);
            return;
          }

          const childValue = value[key];
          const child = locateChildValue(occurrence, key, childValue);
          if (context.excludedPathMatcher(childPathFromRoot, childValue)) {
            markExcludedChildOrigins(occurrence, key, context);
            return;
          }

          await crawlOccurrence(child, childPathFromRoot, activeObjects, activeReferences, context, true);
          return;
        }

        const child = locateChild(occurrence, key);
        if (!child) {
          return;
        }
        if (context.excludedPathMatcher(childPathFromRoot, child.value)) {
          markExcludedChildOrigins(occurrence, key, context);
          return;
        }

        await crawlOccurrence(child, childPathFromRoot, activeObjects, activeReferences, context, true);
      }),
  );
}

/** Resolves one reference and crawls its effective, origin-aware value at the same logical path. */
async function crawlReferenceOccurrence<S extends object, O extends ParserOptions<S>>(
  source: LocatedValue,
  pathFromRoot: string,
  activeReferences: ReferenceChain | undefined,
  context: ResolveContext<S, O>,
) {
  const reference = source.value as { $ref: string };
  const referenceLocation = source.referenceLocation || source;
  ensureLocationMetadata(referenceLocation);
  const external = $Ref.isExternal$Ref(reference);
  const resolutionBase =
    external && context.options.dereference?.externalReferenceResolution === "root"
      ? url.cwd()
      : referenceLocation.dynamicIdScope
        ? referenceLocation.scopeBase
        : referenceLocation.path;
  const resolvedPath = url.resolve(resolutionBase, reference.$ref);
  if (hasReference(activeReferences, resolvedPath)) {
    return false;
  }
  assertReferenceDepth(activeReferences, referenceLocation.path, context.options);

  if (
    external &&
    !(await loadExternalDocument(reference, resolvedPath, resolutionBase, referenceLocation.path, context))
  ) {
    return false;
  }

  const nextActiveReferences: ReferenceChain = {
    path: resolvedPath,
    depth: (activeReferences?.depth ?? 0) + 1,
    ...(activeReferences ? { parent: activeReferences } : {}),
  };
  const target = await selectTarget(resolvedPath, pathFromRoot, context, nextActiveReferences);
  if (!target) {
    return false;
  }

  const effective = mergeReferenceOccurrence(source, target, context.options.dereference?.mergeKeys ?? true);
  await crawlOccurrence(effective, pathFromRoot, undefined, nextActiveReferences, context);
  return true;
}

/** Reads and parses an external document once, even when multiple occurrences race to use it. */
async function loadExternalDocument<S extends object, O extends ParserOptions<S>>(
  reference: { $ref: string },
  resolvedPath: string,
  resolutionBase: string,
  path: string,
  context: ResolveContext<S, O>,
) {
  const withoutHash = url.stripHash(resolvedPath);
  const inFlight = context.documentLoads.get(withoutHash);
  if (inFlight) {
    return inFlight;
  }

  const existing = context.$refs._get$Ref(withoutHash);
  if (existing) {
    markPhysicalExternalDocument(withoutHash, context);
    return !isHandledError(existing.value);
  }

  const load = parse(
    {
      url: resolvedPath,
      baseUrl: resolutionBase,
      reference: reference.$ref,
    },
    context.$refs,
    context.options,
  )
    .then(() => {
      markPhysicalExternalDocument(withoutHash, context);
      return true;
    })
    .catch((error: unknown) => {
      if (!context.options.continueOnError || !isHandledError(error)) {
        throw error;
      }

      if (context.$refs._$refs[withoutHash]) {
        markPhysicalExternalDocument(withoutHash, context);
        error.source = decodeURI(url.stripHash(path));
        error.path = url.safePointerToPath(url.getHash(path));
      }
      return false;
    });
  context.documentLoads.set(withoutHash, load);
  return load;
}

/** Records only documents that were physically parsed, never canonical `$id` aliases. */
function markPhysicalExternalDocument<S extends object, O extends ParserOptions<S>>(
  documentPath: string,
  context: ResolveContext<S, O>,
) {
  if (context.$refs._$refs[documentPath]) {
    context.externalDocuments.add(documentPath);
  }
}

/**
 * Preserve resolve()'s historical full-document inventory. Physical occurrences excluded by the
 * matcher-aware crawl remain literal, while every other branch is inventoried as before.
 */
async function completeExternalDocumentInventory<S extends object, O extends ParserOptions<S>>(
  context: ResolveContext<S, O>,
) {
  const rootPath = url.stripHash(context.$refs._root$Ref.path!);
  for (const documentPath of context.externalDocuments) {
    if (documentPath === rootPath) {
      continue;
    }

    const ref = context.$refs._get$Ref(documentPath);
    if (!ref || isHandledError(ref.value)) {
      continue;
    }

    const scopeBase = ref.dynamicIdScope ? getSchemaBasePath(ref.path!, ref.value, ref.legacyIdScope) : ref.path!;
    await crawlPhysicalOccurrence(
      ref.value,
      ref.path! + "#",
      scopeBase,
      ref.dynamicIdScope,
      ref.legacyIdScope,
      undefined,
      new WeakSet(),
      context,
    );
  }
}

/**
 * Crawls physical document occurrences. An active ancestry chain protects incomplete subtrees
 * containing exclusions; complete subtrees retain the legacy one-visit identity optimization.
 */
async function crawlPhysicalOccurrence<S extends object, O extends ParserOptions<S>>(
  value: unknown,
  path: string,
  scopeBase: string,
  dynamicIdScope: boolean,
  legacyIdScope: boolean,
  activeObjects: ObjectChain | undefined,
  seen: WeakSet<object>,
  context: ResolveContext<S, O>,
) {
  if (
    context.excludedPaths.has(path) ||
    !value ||
    typeof value !== "object" ||
    ArrayBuffer.isView(value) ||
    hasObject(activeObjects, value)
  ) {
    return;
  }

  const hasExcludedDescendant = context.excludedAncestorPaths.has(path);
  if (!hasExcludedDescendant && seen.has(value)) {
    return;
  }
  if (!hasExcludedDescendant) {
    seen.add(value);
  }

  const nextActiveObjects: ObjectChain = {
    value,
    ...(activeObjects ? { parent: activeObjects } : {}),
  };
  const tasks: Promise<unknown>[] = [];
  if ($Ref.isExternal$Ref(value)) {
    const reference = value as { $ref: string };
    const resolutionBase =
      context.options.dereference?.externalReferenceResolution === "root"
        ? url.cwd()
        : dynamicIdScope
          ? scopeBase
          : path;
    const resolvedPath = url.resolve(resolutionBase, reference.$ref);
    tasks.push(loadExternalDocument(reference, resolvedPath, resolutionBase, path, context));
  }

  tasks.push(
    ...Object.keys(value).map(async (key) => {
      const childPath = Pointer.join(path, key);
      if (context.excludedPaths.has(childPath)) {
        return;
      }

      const child = (value as Record<string, unknown>)[key];
      const childLegacyIdScope = getSchemaIdMode(child, legacyIdScope);
      const childScopeBase =
        dynamicIdScope && child && typeof child === "object" && !ArrayBuffer.isView(child)
          ? getSchemaBasePath(scopeBase, child, childLegacyIdScope)
          : scopeBase;
      await crawlPhysicalOccurrence(
        child,
        childPath,
        childScopeBase,
        dynamicIdScope,
        childLegacyIdScope,
        nextActiveObjects,
        seen,
        context,
      );
    }),
  );
  await Promise.all(tasks);
}

function markExcludedOrigins<S extends object, O extends ParserOptions<S>>(
  target: LocatedValue,
  context: ResolveContext<S, O>,
) {
  for (const path of target.originPaths || [target.path]) {
    const normalizedPath = normalizePhysicalPath(path);
    if (context.excludedPaths.has(normalizedPath)) {
      continue;
    }

    context.excludedPaths.add(normalizedPath);
    const documentRoot = url.stripHash(normalizedPath) + "#";
    let ancestor = documentRoot;
    for (const token of Pointer.parse(normalizedPath)) {
      context.excludedAncestorPaths.add(ancestor);
      ancestor = Pointer.join(ancestor, token);
    }
  }
}

function markExcludedChildOrigins<S extends object, O extends ParserOptions<S>>(
  parent: LocatedValue,
  key: string,
  context: ResolveContext<S, O>,
) {
  markExcludedOrigins(
    {
      ...parent,
      path: Pointer.join(parent.path, key),
      originPaths: (parent.originPaths || [parent.path]).map((path) => Pointer.join(path, key)),
    },
    context,
  );
}

function normalizePhysicalPath(path: string) {
  const documentPath = url.stripHash(path);
  const hash = url.getHash(path) || "#";
  return documentPath + hash;
}

/** Selects a fragment without following its final reference. */
async function selectTarget<S extends object, O extends ParserOptions<S>>(
  resolvedPath: string,
  pathFromRoot: string,
  context: ResolveContext<S, O>,
  activeReferences: ReferenceChain | undefined,
): Promise<LocatedValue | undefined> {
  const documentPath = url.stripHash(resolvedPath);
  const ref = context.$refs._get$Ref(documentPath);
  if (!ref || isHandledError(ref.value)) {
    return;
  }

  let current: LocatedValue = {
    value: ref.value,
    path: ref.path! + "#",
    originPaths: [ref.sourcePath || ref.path! + "#"],
    scopeBase: ref.path!,
    dynamicIdScope: ref.dynamicIdScope,
    legacyIdScope: ref.legacyIdScope,
  };
  const isAlias = context.$refs._aliases[documentPath] === ref;
  if (current.dynamicIdScope && !isAlias) {
    current.legacyIdScope = getSchemaIdMode(current.value, current.legacyIdScope);
    current.scopeBase = getSchemaBasePath(current.scopeBase, current.value, current.legacyIdScope);
  }

  let tokens: string[];
  try {
    tokens = Pointer.parse(resolvedPath);
  } catch {
    return;
  }

  for (let index = 0; index < tokens.length; index++) {
    const followed = await followIntermediateReferences(current, pathFromRoot, context, activeReferences);
    if (!followed) {
      return;
    }
    current = followed;

    const token = tokens[index];
    let child = locateChild(current, token);
    if (!child || child.value === undefined || (child.value === null && index === tokens.length - 1)) {
      child = undefined;
      for (let end = tokens.length - 1; end > index; end--) {
        const joinedToken = tokens.slice(index, end + 1).join("/");
        const joinedChild = locateChild(current, joinedToken);
        if (joinedChild?.value !== undefined) {
          child = joinedChild;
          index = end;
          break;
        }
      }

      if (!child) {
        const nullChild = locateChild(current, token);
        if (!nullChild || nullChild.value !== null) {
          return;
        }
        child = nullChild;
      }
    }
    current = child;
    ensureLocationMetadata(current);
  }

  return current;
}

async function followIntermediateReferences<S extends object, O extends ParserOptions<S>>(
  initial: LocatedValue,
  pathFromRoot: string,
  context: ResolveContext<S, O>,
  activeReferences: ReferenceChain | undefined,
): Promise<LocatedValue | undefined> {
  let current = initial;
  let referenceChain = activeReferences;

  while ($Ref.is$Ref(current.value) && $Ref.isAllowed$Ref(current.value, context.options)) {
    const reference = current.value;
    const referenceLocation = current.referenceLocation || current;
    ensureLocationMetadata(referenceLocation);
    const external = $Ref.isExternal$Ref(reference);
    const resolutionBase =
      external && context.options.dereference?.externalReferenceResolution === "root"
        ? url.cwd()
        : referenceLocation.dynamicIdScope
          ? referenceLocation.scopeBase
          : referenceLocation.path;
    const resolvedPath = url.resolve(resolutionBase, reference.$ref);
    if (hasReference(referenceChain, resolvedPath)) {
      return $Ref.isExtended$Ref(reference) ? current : undefined;
    }
    assertReferenceDepth(referenceChain, referenceLocation.path, context.options);

    if (
      external &&
      !(await loadExternalDocument(reference, resolvedPath, resolutionBase, referenceLocation.path, context))
    ) {
      return;
    }

    const nextReferenceChain: ReferenceChain = {
      path: resolvedPath,
      depth: (referenceChain?.depth ?? 0) + 1,
      ...(referenceChain ? { parent: referenceChain } : {}),
    };
    const target = await selectTarget(resolvedPath, pathFromRoot, context, nextReferenceChain);
    if (!target) {
      return;
    }

    current = mergeReferenceOccurrence(current, target, context.options.dereference?.mergeKeys ?? true);
    referenceChain = nextReferenceChain;
  }

  return current;
}

/** Builds the same effective value as dereference, retaining a URI origin for every child. */
function mergeReferenceOccurrence(source: LocatedValue, target: LocatedValue, mergeKeys: boolean): LocatedValue {
  if (!$Ref.isExtended$Ref(source.value) || target.value === null || typeof target.value !== "object") {
    return target;
  }

  return mergeLocatedObjects(target, source, mergeKeys, true, undefined);
}

function mergeLocatedObjects(
  target: LocatedValue,
  source: LocatedValue,
  mergeKeys: boolean,
  ignoreSourceRef: boolean,
  activeMerges: MergeChain | undefined,
): LocatedValue {
  const targetObject = target.value as object;
  const sourceObject = source.value as object;
  const existing = findActiveMerge(activeMerges, targetObject, sourceObject);
  if (existing) {
    return existing;
  }

  const output: Record<string, unknown> | unknown[] =
    !ignoreSourceRef && Array.isArray(target.value) ? new Array(target.value.length) : {};
  const children = new Map<string, LocatedValue | DeferredChild>();
  const merged: LocatedValue = {
    value: output,
    path: target.path,
    originPaths: mergeOriginPaths(target, source),
    scopeBase: target.scopeBase,
    dynamicIdScope: target.dynamicIdScope,
    legacyIdScope: target.legacyIdScope,
    children,
    resolveMetadata() {
      ensureLocationMetadata(target);
      merged.scopeBase = target.scopeBase;
      merged.dynamicIdScope = target.dynamicIdScope;
      merged.legacyIdScope = target.legacyIdScope;
    },
  };
  const nextActiveMerges: MergeChain = {
    target: targetObject,
    source: sourceObject,
    value: merged,
    ...(activeMerges ? { parent: activeMerges } : {}),
  };

  const sourceKeys = new Set(Object.keys(sourceObject).filter((key) => !(ignoreSourceRef && key === "$ref")));
  const targetKeys = new Set(Object.keys(targetObject));
  const keys = new Set([...sourceKeys, ...targetKeys]);
  for (const key of keys) {
    const resolveChild = () => {
      const sourceChild = sourceKeys.has(key) ? locateChild(source, key)! : undefined;
      let child: LocatedValue;
      if (
        sourceChild &&
        (!targetKeys.has(key) ||
          !mergeKeys ||
          sourceChild.value === null ||
          typeof sourceChild.value !== "object" ||
          Array.isArray(sourceChild.value))
      ) {
        child = sourceChild;
      } else {
        const targetChild = locateChild(target, key)!;
        child =
          sourceChild && targetChild.value !== null && typeof targetChild.value === "object"
            ? mergeLocatedObjects(targetChild, sourceChild, true, false, nextActiveMerges)
            : sourceChild || targetChild;
      }

      children.set(key, child);
      defineDataProperty(output, key, child.value);
      if (key === "$ref" && typeof child.value === "string") {
        merged.referenceLocation = child.owner || target;
      }
      return child;
    };
    children.set(key, {
      resolve: resolveChild,
      requiresPrecheck: childResolutionMayInvokeAccessor(
        sourceObject,
        targetObject,
        key,
        sourceKeys.has(key),
        targetKeys.has(key),
        mergeKeys,
      ),
    });
    defineLazyProperty(output, key, () => locateChild(merged, key)!.value);
  }
  return merged;
}

function findActiveMerge(chain: MergeChain | undefined, target: object, source: object) {
  for (let current = chain; current; current = current.parent) {
    if (current.target === target && current.source === source) {
      return current.value;
    }
  }
  return undefined;
}

function locateChild(parent: LocatedValue, key: string): LocatedValue | undefined {
  if (parent.children) {
    const child = parent.children.get(key);
    if (!child || !("resolve" in child)) {
      return child;
    }
    const resolved = child.resolve();
    parent.children.set(key, resolved);
    return resolved;
  }

  const value = parent.value;
  if (value === null || (typeof value !== "object" && typeof value !== "function") || !(key in value)) {
    return;
  }

  return locateChildValue(parent, key, (value as Record<string, unknown>)[key]);
}

function locateChildValue(parent: LocatedValue, key: string, childValue: unknown): LocatedValue {
  const child: LocatedValue = {
    value: childValue,
    path: Pointer.join(parent.path, key),
    originPaths: (parent.originPaths || [parent.path]).map((path) => Pointer.join(path, key)),
    scopeBase: parent.scopeBase,
    dynamicIdScope: parent.dynamicIdScope,
    legacyIdScope: parent.legacyIdScope,
    owner: parent,
    resolveMetadata() {
      ensureLocationMetadata(parent);
      const childLegacyIdScope = getSchemaIdMode(childValue, parent.legacyIdScope);
      child.legacyIdScope = childLegacyIdScope;
      child.scopeBase =
        parent.dynamicIdScope && childValue && typeof childValue === "object" && !ArrayBuffer.isView(childValue)
          ? getSchemaBasePath(parent.scopeBase, childValue, childLegacyIdScope)
          : parent.scopeBase;
    },
  };
  return child;
}

function mergeOriginPaths(target: LocatedValue, source: LocatedValue) {
  return [...new Set([...(target.originPaths || [target.path]), ...(source.originPaths || [source.path])])];
}

function ensureLocationMetadata(value: LocatedValue) {
  const resolveMetadata = value.resolveMetadata;
  if (resolveMetadata) {
    delete value.resolveMetadata;
    resolveMetadata();
  }
}

function requiresChildPrecheck(parent: LocatedValue, key: string) {
  const child = parent.children?.get(key);
  return Boolean(child && "resolve" in child && child.requiresPrecheck);
}

function childResolutionMayInvokeAccessor(
  source: object,
  target: object,
  key: string,
  sourceHasKey: boolean,
  targetHasKey: boolean,
  mergeKeys: boolean,
) {
  const sourceDescriptor = sourceHasKey ? Object.getOwnPropertyDescriptor(source, key) : undefined;
  if (sourceDescriptor?.get) {
    return true;
  }
  if (!sourceHasKey) {
    return Boolean(targetHasKey && Object.getOwnPropertyDescriptor(target, key)?.get);
  }

  const sourceValue = sourceDescriptor?.value;
  const sourceWins =
    !targetHasKey ||
    !mergeKeys ||
    sourceValue === null ||
    typeof sourceValue !== "object" ||
    Array.isArray(sourceValue);
  return !sourceWins && Boolean(Object.getOwnPropertyDescriptor(target, key)?.get);
}

function hasObject(chain: ObjectChain | undefined, value: object) {
  for (let current = chain; current; current = current.parent) {
    if (current.value === value) {
      return true;
    }
  }
  return false;
}

function hasReference(chain: ReferenceChain | undefined, path: string) {
  for (let current = chain; current; current = current.parent) {
    if (current.path === path) {
      return true;
    }
  }
  return false;
}

function assertReferenceDepth<S extends object>(
  chain: ReferenceChain | undefined,
  path: string,
  options: ParserOptions<S>,
) {
  const maxDepth = options.dereference?.maxDepth ?? 500;
  if ((chain?.depth ?? 0) >= maxDepth) {
    throw new RangeError(
      `Maximum dereference depth (${maxDepth}) exceeded at ${path}. ` +
        "This likely indicates an extremely deep or recursive schema. " +
        "You can increase this limit with the dereference.maxDepth option.",
    );
  }
}

function defineDataProperty(object: object, key: string, value: unknown) {
  Object.defineProperty(object, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function defineLazyProperty(object: object, key: string, get: () => unknown) {
  Object.defineProperty(object, key, {
    get,
    enumerable: true,
    configurable: true,
  });
}
