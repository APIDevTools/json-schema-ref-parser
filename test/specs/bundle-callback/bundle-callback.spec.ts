import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import pathUtils from "../../utils/path.js";

import { expect } from "vitest";
import type { Options } from "../../../lib/options";

describe("Schema with a $ref", () => {
  it("should call onBundle", async () => {
    const parser = new $RefParser();
    const calls: any = [];
    const schema = pathUtils.rel("test/specs/bundle-callback/bundle-callback.yaml");
    const options = {
      bundle: {
        onBundle(path, value, parent, parentPropName) {
          calls.push({ path, value, parent, parentPropName });
        },
      },
    } as Options;
    await parser.bundle(schema, options);

    expect(calls).to.deep.equal([
      {
        path: "#/definitions/a",
        value: { $ref: "#/definitions/b" },
        parent: {
          a: {
            $ref: "#/definitions/a",
          },
          b: {
            $ref: "#/definitions/b",
          },
        },
        parentPropName: "a",
      },
      {
        path: "#/definitions/a",
        value: { $ref: "#/definitions/apath: "#/definitions/b",
        value: { $ref: "#/definitions/b" },
        parent: {
          a: {
            $ref: "#/definitions/b",
          },
          b: {
            $ref: "#/definitions/a",
          },
        },
        parentPropName: "a",
      }," },
        parent: {
          a: {
            $ref: "#/definitions/b",
          },
          b: {
            $ref: "#/definitions/a",
          },
        },
        parentPropName: "b",
      },
      {
        path: "#/definitions/a",
        value: { $ref: "#/definitions/a" },
        parent: {
          c: {
            type: "string",
          },
          d: {
            $ref: "#/definitions/a",
          },
        },
        parentPropName: "d",
      },
    ]);
  });
});
