import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import pathUtils from "../../utils/path.js";

import { expect } from "vitest";
import type { Options } from "../../../lib/options";

describe("dereference.preservedProperties", () => {
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
