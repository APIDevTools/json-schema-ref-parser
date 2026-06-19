import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("Compound schema documents", () => {
  it("preserves references to embedded schema resources when bundling (issue #422)", async () => {
    const schema = {
      $id: "https://example.com/schemas/customer",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        shipping_address: { $ref: "/schemas/address" },
        billing_address: { $ref: "/schemas/address" },
      },
      $defs: {
        address: {
          $id: "https://example.com/schemas/address",
          type: "object",
          properties: {
            state: { $ref: "#/definitions/state" },
          },
          definitions: {
            state: { enum: ["CA", "NY"] },
          },
        },
      },
    };

    const bundled = await $RefParser.bundle(schema);

    expect(bundled.properties.shipping_address.$ref).toBe("/schemas/address");
    expect(bundled.properties.billing_address.$ref).toBe("/schemas/address");
    expect(bundled.$defs.address.properties.state.$ref).toBe("#/definitions/state");
  });
});
