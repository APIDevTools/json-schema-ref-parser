import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

/**
 * Tests that onCircular is called for EVERY occurrence of a circular $ref,
 * not just the first detection. The schema has 5 $refs to #/definitions/Node:
 *   1. definitions/Node/properties/self       (self-reference)
 *   2. definitions/Container/properties/primaryNode
 *   3. definitions/Container/properties/secondaryNode
 *   4. definitions/Container/properties/nodeList/items
 *   5. root
 */
describe("Schema with multiple occurrences of the same circular $ref target", () => {
  const SCHEMA_PATH = "test/specs/circular-multi-occurrence/schema.yaml";

  const EXPECTED_PATH_SUFFIXES = [
    "definitions/Node/properties/self",
    "definitions/Container/properties/primaryNode",
    "definitions/Container/properties/secondaryNode",
    "definitions/Container/properties/nodeList/items",
    "/root",
  ] as const;

  it.each([
    { mode: "true (default)", circular: true as const },
    { mode: "'ignore'", circular: "ignore" as const },
  ])("should call onCircular for every occurrence (circular: $mode)", async ({ circular }) => {
    const circularRefs: string[] = [];

    const parser = new $RefParser();
    await parser.dereference(path.rel(SCHEMA_PATH), {
      dereference: {
        circular,
        onCircular: (refPath: string) => circularRefs.push(refPath),
      },
    });

    // Exactly 5 calls, all unique paths
    expect(circularRefs).toHaveLength(5);
    expect(new Set(circularRefs).size).toBe(5);
    expect(parser.$refs.circular).toBe(true);

    // Each expected path suffix should appear exactly once
    for (const expectedSuffix of EXPECTED_PATH_SUFFIXES) {
      const matches = circularRefs.filter((p) => p.endsWith(expectedSuffix));
      expect(matches, `Expected exactly one path ending with "${expectedSuffix}"`).toHaveLength(1);
    }
  });
});
