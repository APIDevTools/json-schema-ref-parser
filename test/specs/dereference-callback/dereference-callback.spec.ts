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
        onDereference(path, value, parent, parentPropName) {
          calls.push({ path, value, parent, parentPropName });
        },
      },
    } as Options;
    await parser.dereference(schema, options);

    expect(calls).to.deep.equal([
      {
        path: "#/definitions/b",
        value: { $ref: "#/definitions/b" },
        parent: {
          a: {
            $ref: "#/definitions/b",
          },
          b: {
            $ref: "#/definitions/b",
          },
        },
        parentPropName: "a",
      },
      {
        path: "#/definitions/a",
        value: { $ref: "#/definitions/b" },
        parent: {
          c: {
            type: "string",
          },
          d: {
            $ref: "#/definitions/b",
          },
        },
        parentPropName: "d",
      },
    ]);
  });
});
