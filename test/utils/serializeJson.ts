import { SnapshotSerializer } from "vitest";

/**
 * This serializes JSON objects as plain JSON strings for snapshot testing
 * Default formatter normally serializes JSON objects as a custom JS-like format
 * But it doesn't look well in .json files
 */
export default {
  serialize(val, config, indentation, depth, refs, printer) {
    return JSON.stringify(val, null, 2);
  },
  test(val) {
    return val && typeof val === "object" && val.constructor === Object;
  },
} satisfies SnapshotSerializer;
