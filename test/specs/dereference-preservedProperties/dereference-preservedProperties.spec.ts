import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import pathUtils from "../../utils/path.js";

import { expect } from "vitest";
import type { Options } from "../../../lib/options";

describe("dereference.preservedProperties", () => {
  it.each([null, false, 0, "literal"])("handles the primitive target %j", async (target) => {
    const schema = {
      definitions: { target },
      value: { $ref: "#/definitions/target", description: "Keep if the target is an object" },
    };

    const result = await $RefParser.dereference(schema, {
      dereference: { preservedProperties: ["description"] },
    });

    expect(result.value).toBe(target);
  });

  it("should preserve properties", async () => {
    const parser = new $RefParser();
    const schema = pathUtils.rel("test/specs/dereference-preservedProperties/dereference-preservedProperties.yaml");
    const options = {
      dereference: {
        preservedProperties: ["description"],
      },
    } as Options;
    const res = await parser.dereference(schema, options);

    expect(res).to.deep.equal({
      title: "Person",
      required: ["name"],
      type: "object",
      definitions: {
        name: {
          type: "string",
          description: "Someone's name",
        },
      },
      properties: {
        name: {
          type: "string",
          description: "Someone's name",
        },
        secretName: {
          type: "string",
          description: "Someone's secret name",
        },
      },
    });
  });
});
