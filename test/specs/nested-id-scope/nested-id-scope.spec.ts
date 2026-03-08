import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

function createSchema() {
  return {
    $schema: "https://json-schema.org/draft/2019-09/schema",
    $id: "http://example.com/schemas/person.json",
    type: "object",
    properties: {
      address: {
        $id: "http://example.com/schemas/address.json",
        type: "object",
        properties: {
          country: {
            $ref: "#/definitions/country",
          },
        },
        definitions: {
          country: {
            type: "integer",
          },
        },
      },
    },
    definitions: {
      country: {
        type: "string",
      },
    },
  };
}

describe("nested $id scopes (issue #417)", () => {
  it("should resolve internal refs against the nearest nested $id scope", async () => {
    const $refs = await $RefParser.resolve(createSchema());

    expect($refs.get("http://example.com/schemas/address.json#/definitions/country")).toEqual({
      type: "integer",
    });

    const dereferenced = await $RefParser.dereference(createSchema());
    expect(dereferenced.properties.address.properties.country).toEqual({
      type: "integer",
    });
    expect(dereferenced.definitions.country).toEqual({
      type: "string",
    });
  });

  it("should resolve relative external refs against a nested $id scope in YAML schemas", async () => {
    const dereferenced = await $RefParser.dereference(path.rel("test/specs/nested-id-scope/root.yaml"));

    expect(dereferenced.properties.address.properties.country).toEqual({
      type: "integer",
    });
  });
});
