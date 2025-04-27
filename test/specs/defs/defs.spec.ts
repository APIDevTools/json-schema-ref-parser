import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import schemaA from "./schemaA.json";
import schemaB from "./schemaB.json";

describe("Defs", () => {
  it("definitions and $defs should both work", async () => {
    const parser = new $RefParser();

    const resultA = await parser.dereference(schemaA, { mutateInputSchema: false });
    await expect(resultA).toMatchFileSnapshot("dereferencedA.json");

    const resultB = await parser.dereference(schemaB, { mutateInputSchema: false });
    await expect(resultB).toMatchFileSnapshot("dereferencedB.json");
  });
});
