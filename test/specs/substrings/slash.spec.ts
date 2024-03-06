import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

import { expect } from "vitest";

describe("$refs that include slashes", () => {
  it("should parse successfully", async () => {
    const parser = new $RefParser();
    await parser.parse(path.rel("test/specs/substrings/definitions/slash-strings.yaml"));
    const $refs = parser.$refs;
    const ref = $refs.get(
      "#/channels/smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured/parameters",
    );
    expect(ref).to.deep.equal({
      streetlightId: {
        description: "The ID of the streetlight.",
        schema: {
          type: "string",
        },
      },
    });
  });

  it("should parse trailing spaces successfully", async () => {
    const parser = new $RefParser();
    const derefed = await parser.dereference({
      swagger: "2.0",
      paths: {
        somepath: {
          post: {
            $ref: "#/definitions/ABC ",
          },
        },
      },
      definitions: {
        "ABC ": {
          // tested removing space at the end of "ABC "
          type: "object",
          properties: {
            abc: {
              type: "string",
            },
          },
          title: "ABC ",
        },
      },
    });
    expect(derefed).to.deep.equal({
      swagger: "2.0",
      paths: {
        somepath: {
          post: {
            type: "object",
            properties: {
              abc: {
                type: "string",
              },
            },
            title: "ABC ",
          },
        },
      },
      definitions: {
        "ABC ": {
          type: "object",
          properties: {
            abc: {
              type: "string",
            },
          },
          title: "ABC ",
        },
      },
    });
  });
});
