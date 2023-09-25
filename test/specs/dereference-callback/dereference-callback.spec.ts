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
        onDereference(path, value, object, propName) {
          calls.push({ path, value, object, propName });
        },
      },
    } as Options;
    await parser.dereference(schema, options);

    expect(calls).to.deep.equal([
      {
        path: "#/definitions/b",
        value: { $ref: "#/definitions/a" },
        object: {
          a: {
            $ref: "#/definitions/a",
          },
          b: {
            $ref: "#/definitions/a",
          },
        },
        propName: "a",
      },
      {
        path: "#/definitions/a",
        value: { $ref: "#/definitions/a" },
        object: {
          c: {
            type: "string",
          },
          d: {
            $ref: "#/definitions/a",
          },
        },
        propName: "d",
      },
    ]);
  });
});
