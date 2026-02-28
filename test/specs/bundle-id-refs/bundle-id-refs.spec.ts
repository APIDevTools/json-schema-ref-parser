import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("Bundle with $id in sub-schemas (issue #355)", () => {
  it("should not create invalid cross-$id $ref pointers when bundling", async () => {
    const parser = new $RefParser();
    const bundled = await parser.bundle(path.rel("test/specs/bundle-id-refs/root.schema.json"));

    // The bundled schema should have both sub-schemas inlined
    expect(bundled.oneOf).toHaveLength(2);

    const sub1 = bundled.oneOf[0];
    const sub2 = bundled.oneOf[1];

    // sub1 should have the base schema inlined in its allOf
    expect(sub1.$id).toBe("sub1.schema.json");
    expect(sub1.allOf[0]).toHaveProperty("$id", "base.schema.json");
    expect(sub1.allOf[0]).toHaveProperty("type", "object");

    // sub2 also references base.schema.json. Since sub2 has $id: "sub2.schema.json",
    // a bare #/oneOf/0/allOf/0 ref would resolve relative to sub2's $id, which is wrong.
    // The bundler should qualify the ref with the root $id.
    expect(sub2.$id).toBe("sub2.schema.json");

    const sub2BaseRef = sub2.allOf[0];
    // The ref should be qualified with the root $id to avoid $id scoping issues
    expect(sub2BaseRef.$ref).toBe("root.schema.json#/oneOf/0/allOf/0");
  });
});
