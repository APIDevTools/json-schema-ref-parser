import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path";

describe("Bundle $defs encoding", () => {
  it("should not URL-encode $ in $defs when bundling cross-references", async () => {
    const parser = new $RefParser();
    const schema = path.rel("test/specs/bundle-defs-encoding/parent.json");
    const bundled = await parser.bundle(schema);

    // Debug: log the bundled schema
    console.log('Bundled schema:', JSON.stringify(bundled, null, 2));

    // The bundled schema should have $defs section with myschema that references otherschema
    expect(bundled).toHaveProperty("$defs");
    expect(bundled.$defs).toHaveProperty("myschema");
    expect(bundled.$defs).toHaveProperty("otherschema");

    // Check that myschema has allOf with a reference to otherschema
    const myschema = bundled.$defs.myschema;
    expect(myschema).toHaveProperty("allOf");
    expect(Array.isArray(myschema.allOf)).toBe(true);
    expect(myschema.allOf.length).toBeGreaterThan(0);

    // The critical assertion: the $ref should be #/$defs/otherschema, NOT #/%24defs/otherschema
    const refToOtherSchema = myschema.allOf[0].$ref;
    expect(refToOtherSchema).toBeDefined();
    expect(refToOtherSchema).toMatch(/^#\/\$defs\//);
    expect(refToOtherSchema).not.toMatch(/%24defs/);
    expect(refToOtherSchema).toBe("#/$defs/otherschema");

    // Verify the complete bundled structure matches expected output
    const expected = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        foo: {
          type: "string",
        },
      },
      $defs: {
        myschema: {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          allOf: [
            {
              $ref: "#/$defs/otherschema",
            },
            {
              properties: {
                someProp: {
                  type: "string",
                },
              },
            },
          ],
        },
        otherschema: {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: {
            otherProp: {
              type: "string",
            },
          },
        },
      },
    };

    expect(bundled).toEqual(expected);
  });
});
