import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

// Every $ref visited while bundling used to trigger a linear scan of the inventory
// (see issue #442), so bundling time grew quadratically with the number of $refs.
describe("bundle() with many $refs", () => {
  const count = 60000;

  function makeSchema(n: number) {
    const definitions: Record<string, object> = {};
    for (let i = 0; i < n; i++) {
      definitions["d" + i] = { type: "string" };
    }
    return {
      items: Array.from({ length: n }, (_, i) => ({ $ref: "#/definitions/d" + i })),
      definitions,
    };
  }

  it("stays roughly linear in the number of $refs", async () => {
    const schema = makeSchema(count);
    const start = performance.now();
    const bundled = (await $RefParser.bundle(schema)) as any;
    const elapsed = performance.now() - start;

    expect(bundled.items).toHaveLength(count);
    expect(bundled.items[0]).toEqual({ $ref: "#/definitions/d0" });
    expect(bundled.items[count - 1]).toEqual({ $ref: "#/definitions/d" + (count - 1) });
    // The quadratic scan takes several seconds for this input; a linear pass takes well under one.
    expect(elapsed).toBeLessThan(3000);
  }, 60000);
});
