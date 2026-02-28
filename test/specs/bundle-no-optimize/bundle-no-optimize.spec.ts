import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("bundle.optimizeInternalRefs option (issue #392)", () => {
  it("should optimize internal ref chains by default", async () => {
    const parser = new $RefParser();
    const bundled = await parser.bundle(path.rel("test/specs/bundle-no-optimize/root.json"));

    // By default, fixRefsThroughRefs optimizes the chain:
    // item -> #/definitions/extended -> #/definitions/base
    // becomes: item -> #/definitions/base (skipping intermediate)
    expect(bundled.properties.item.$ref).toBe("#/definitions/base");
  });

  it("should preserve internal ref chains when optimizeInternalRefs is false", async () => {
    const parser = new $RefParser();
    const bundled = await parser.bundle(path.rel("test/specs/bundle-no-optimize/root.json"), {
      bundle: { optimizeInternalRefs: false },
    });

    // With optimization disabled, the original chain is preserved:
    // item still points to #/definitions/extended
    expect(bundled.properties.item.$ref).toBe("#/definitions/extended");
  });
});
