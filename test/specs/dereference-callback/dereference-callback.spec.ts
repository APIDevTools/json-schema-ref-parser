import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import pathUtils from "../../utils/path.js";

import { expect } from "vitest";
import type { Options } from "../../../lib/options";

describe("Schema with a $ref", () => {
  it("should call onDereference", async () => {
    const parser = new $RefParser();
    const calls: any = [];
    const schema = pathUtils.rel("test/specs/dereference-callback/dereference-callback.yaml");
    const options = {
      dereference: {
        onDereference(path: any, object: any) {
          calls.push({ path, object });
        },
      },
    } as Options;
    await parser.dereference(schema, options);
    expect(calls).to.deep.equal([
      { path: "#/definitions/b", object: { $ref: "#/definitions/a" } },
      { path: "#/definitions/a", object: { $ref: "#/definitions/a" } },
    ]);
  });
});
