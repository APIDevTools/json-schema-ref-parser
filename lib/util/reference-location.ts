import { getSchemaBasePath, getSchemaIdMode } from "./schema-resources.js";

/** The original URI scope of one value, independent of where a merge places it. */
export interface ReferenceLocation {
  value: unknown;
  path: string;
  scopeBase: string;
  dynamicIdScope: boolean;
  legacyIdScope: boolean;
  child?: (key: string, value: unknown) => ReferenceLocation;
}

// Metadata belongs to a parser's reference registry, never to the user's schema.
const mergedLocations = new WeakMap<object, WeakMap<object, ReferenceLocation>>();

export function getReferenceLocation(owner: object, value: unknown): ReferenceLocation | undefined {
  return isObject(value) ? mergedLocations.get(owner)?.get(value) : undefined;
}

export function locateChild(owner: object, parent: ReferenceLocation, key: string, value: unknown): ReferenceLocation {
  if (parent.child) {
    return parent.child(key, value);
  }

  const known = getReferenceLocation(owner, value);
  if (known) {
    return known;
  }

  const legacyIdScope = getSchemaIdMode(value, parent.legacyIdScope);
  const scopeBase =
    parent.dynamicIdScope && isObject(value) && !ArrayBuffer.isView(value)
      ? getSchemaBasePath(parent.scopeBase, value, legacyIdScope)
      : parent.scopeBase;
  const path =
    (parent.path.includes("#") ? parent.path : parent.path + "#") +
    "/" +
    key.replace(/%/g, "%25").replace(/~/g, "~0").replace(/\//g, "~1");

  return { value, path, scopeBase, dynamicIdScope: parent.dynamicIdScope, legacyIdScope };
}

/**
 * Describes an existing extended-reference merge without traversing its children.
 * This mirrors the property choices in $Ref.dereference/deepMerge while retaining
 * the separate source and target scopes, including through subsequent merges.
 */
export function locateMergedValue(
  owner: object,
  value: unknown,
  target: ReferenceLocation,
  source: ReferenceLocation,
  mergeKeys: boolean,
  ignoreSourceRef = true,
): ReferenceLocation {
  if (!isObject(value) || !isObject(target.value) || !isObject(source.value)) {
    return { ...target, value };
  }

  const targetObject = target.value;
  const sourceObject = source.value;
  // A nested merge can retain a reference from either side. That keyword's
  // location controls the next reference hop; each sibling keeps its own origin.
  const referenceOrigin = !ignoreSourceRef && Object.hasOwn(sourceObject, "$ref") ? source : target;
  const location: ReferenceLocation = {
    ...referenceOrigin,
    value,
    child(key, childValue) {
      const fromSource = (!ignoreSourceRef || key !== "$ref") && Object.hasOwn(sourceObject, key);
      if (!fromSource) {
        return locateChild(owner, target, key, childValue);
      }

      if (!mergeKeys || !isObject(childValue)) {
        return locateChild(owner, source, key, childValue);
      }

      const sourceValue = sourceObject[key];
      const sourceChild = locateChild(owner, source, key, sourceValue);
      if (!isObject(sourceValue) || Array.isArray(sourceValue)) {
        return { ...sourceChild, value: childValue };
      }
      const targetValue = Object.hasOwn(targetObject, key) ? targetObject[key] : undefined;
      if (isObject(targetValue) && !Array.isArray(targetValue)) {
        const known = getReferenceLocation(owner, childValue);
        return (
          known ||
          locateMergedValue(owner, childValue, locateChild(owner, target, key, targetValue), sourceChild, true, false)
        );
      }

      return { ...sourceChild, value: childValue };
    },
  };

  let locations = mergedLocations.get(owner);
  if (!locations) {
    locations = new WeakMap();
    mergedLocations.set(owner, locations);
  }
  locations.set(value, location);
  return location;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}
