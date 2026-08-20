import type $Refs from "../refs.js";

const valuesExcludedDuringResolutionByRefs = new WeakMap<$Refs, WeakSet<object>>();

/** Clears values skipped during resolution in the previous operation for this $Refs instance. */
export function resetResolutionExclusions($refs: $Refs) {
  valuesExcludedDuringResolutionByRefs.delete($refs);
}

/** Records a value and every crawlable descendant as skipped during resolution. */
export function markValueExcludedDuringResolution($refs: $Refs, value: unknown) {
  if (!isCrawlableObject(value)) {
    return;
  }

  let valuesExcludedDuringResolution = valuesExcludedDuringResolutionByRefs.get($refs);
  if (!valuesExcludedDuringResolution) {
    valuesExcludedDuringResolution = new WeakSet();
    valuesExcludedDuringResolutionByRefs.set($refs, valuesExcludedDuringResolution);
  }

  const valuesToRecord: object[] = [value];
  while (valuesToRecord.length > 0) {
    const currentValue = valuesToRecord.pop()!;
    if (valuesExcludedDuringResolution.has(currentValue)) {
      continue;
    }

    valuesExcludedDuringResolution.add(currentValue);
    for (const childValue of Object.values(currentValue)) {
      if (isCrawlableObject(childValue)) {
        valuesToRecord.push(childValue);
      }
    }
  }
}

/** Returns whether a value was skipped during resolution for the current operation. */
export function wasExcludedDuringResolution($refs: $Refs, value: unknown) {
  return isCrawlableObject(value) && Boolean(valuesExcludedDuringResolutionByRefs.get($refs)?.has(value));
}

function isCrawlableObject(value: unknown): value is object {
  return value !== null && typeof value === "object" && !ArrayBuffer.isView(value);
}
