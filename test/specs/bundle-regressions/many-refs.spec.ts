import { expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

it("remaps every reference in a large array to its own definition", async () => {
  const keys = Array.from({ length: 2048 }, (_, i) => "d" + i);
  const schema = {
    definitions: Object.fromEntries(keys.map((key) => [key, { type: "string" }])),
    alias: { $ref: "#/definitions" },
    items: keys.map((key) => ({ $ref: "#/alias/" + key })),
  };

  const bundled = await $RefParser.bundle<typeof schema>(schema);

  expect(bundled.items).toEqual(keys.map((key) => ({ $ref: "#/definitions/" + key })));
});
