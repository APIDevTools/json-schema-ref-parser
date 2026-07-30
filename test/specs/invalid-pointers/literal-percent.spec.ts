import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import { InvalidPointerError, JSONParserErrorGroup } from "../../../lib/util/errors.js";

describe("invalid pointers with literal percent signs", () => {
  it("reports the invalid pointer without masking it with a URIError", async () => {
    const source = "https://example.com/schemas/100%/root.json";
    const parser = new $RefParser();
    let caught: unknown;

    try {
      await parser.dereference(
        source,
        {
          $id: source,
          invalid: { $ref: `${source}#not-a-pointer` },
        },
        { continueOnError: true },
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(JSONParserErrorGroup);
    expect((caught as JSONParserErrorGroup).errors[0]).toMatchObject({
      name: InvalidPointerError.name,
      source,
    });
  });
});
