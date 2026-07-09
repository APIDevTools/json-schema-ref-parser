import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("Circular $ref chains", () => {
  for (const length of [3, 4]) {
    it(`detects a cycle of length ${length} without overflowing`, async () => {
      const input = createCircularSchema(length);
      const parser = new $RefParser();

      const result = await parser.dereference(input);

      expect(result).to.be.an("object");
      expect(parser.$refs.circular).to.equal(true);
    });
  }

  it("honors dereference.circular=false", async () => {
    const parser = new $RefParser();

    await expect(
      parser.dereference(createCircularSchema(3), {
        dereference: { circular: false },
      }),
    ).rejects.toThrowError(ReferenceError);
  });

  it("bundles a multi-reference cycle without overflowing", async () => {
    const parser = new $RefParser();

    const result = await parser.bundle(createCircularSchema(3));

    expect(result).to.be.an("object");
  });
});

function createCircularSchema(length: number) {
  const schemas: Record<string, { $ref: string }> = {};
  for (let index = 0; index < length; index++) {
    schemas[`node${index}`] = {
      $ref: `#/components/schemas/node${(index + 1) % length}`,
    };
  }

  return {
    components: { schemas },
    entry: { $ref: "#/components/schemas/node0" },
  };
}
