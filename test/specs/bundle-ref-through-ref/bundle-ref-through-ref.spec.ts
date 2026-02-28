import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("Issue #338: bundle() should not create refs through refs", () => {
  it("should produce valid bundled output where no $ref path traverses through another $ref", async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel("test/specs/bundle-ref-through-ref/schemaA.json"));

    const bundledStr = JSON.stringify(schema, null, 2);

    // Collect all $ref values in the bundled schema
    const refs: string[] = [];
    function collectRefs(obj: any, path: string) {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => collectRefs(item, `${path}/${i}`));
        return;
      }
      for (const [key, val] of Object.entries(obj)) {
        if (key === "$ref" && typeof val === "string") {
          refs.push(val);
        } else {
          collectRefs(val, `${path}/${key}`);
        }
      }
    }
    collectRefs(schema, "#");

    // For each $ref, verify the path can be resolved by walking the literal
    // object structure (without following $ref indirection)
    for (const ref of refs) {
      if (!ref.startsWith("#/")) continue;

      const segments = ref.slice(2).split("/");
      let current: any = schema;
      let valid = true;
      let failedAt = "";

      for (const seg of segments) {
        if (current === null || current === undefined || typeof current !== "object") {
          valid = false;
          failedAt = seg;
          break;
        }
        // If the current value at this path is itself a $ref, the path is invalid
        // (JSON pointer resolution doesn't follow $ref indirection)
        if ("$ref" in current && typeof current.$ref === "string" && seg !== "$ref") {
          // This position has a $ref - the pointer can't traverse through it
          valid = false;
          failedAt = `$ref at ${seg}`;
          break;
        }
        const idx = Array.isArray(current) ? parseInt(seg) : seg;
        current = current[idx];
      }

      expect(valid, `$ref "${ref}" traverses through another $ref (failed at: ${failedAt}). Bundled:\n${bundledStr}`).toBe(
        true,
      );
    }
  });
});
