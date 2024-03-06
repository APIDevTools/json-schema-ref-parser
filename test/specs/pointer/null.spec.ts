import { describe, it } from "vitest";
import Pointer from "../../../lib/pointer";

describe("Pointers", () => {
  it("should parse successfully", async () => {
    Pointer.parse("#/c%d");
  });
});
