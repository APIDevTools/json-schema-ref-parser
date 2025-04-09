import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";

import { expect } from "vitest";

describe("Schema with an extensive amount of circular $refs", () => {
  it.only("should dereference successfully", async () => {
    const circularRefs = new Set<string>();

    const parser = new $RefParser<Record<string, any>>();
    const schema = await parser.dereference(path.rel("test/specs/circular-extensive/schema.json"), {
      dereference: {
        onCircular: (ref: string) => circularRefs.add(ref),
      },
    });

    // Ensure that a non-circular $ref was dereferenced.
    expect(schema.components?.schemas?.ArrayOfMappedData).toStrictEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          mappingTypeName: { type: 'string' },
          sourceSystemValue: { type: 'string' },
          mappedValueID: { type: 'string' },
          mappedValue: { type: 'string' }
        },
        additionalProperties: false
      }
    });

    // Ensure that a circular $ref **was** dereferenced.
    expect(circularRefs).toHaveLength(23);
    expect(schema.components?.schemas?.Customer?.properties?.customerNode).toStrictEqual({
      "type": "array",
      "items": {
        type: 'object',
        properties: {
          customerNodeGuid: expect.any(Object),
          customerGuid: expect.any(Object),
          nodeId: expect.any(Object),
          customerGu: expect.any(Object)
        },
        additionalProperties: false
      },
    });
  });

  it("should dereference successfully with `dereference.circular` is `ignore`", async () => {
    const circularRefs = new Set<string>();

    const parser = new $RefParser<Record<string, any>>();
    const schema = await parser.dereference(path.rel("test/specs/circular-extensive/schema.json"), {
      dereference: {
        onCircular: (ref: string) => circularRefs.add(ref),
        circular: 'ignore',
      },
    });

    // Ensure that a non-circular $ref was dereferenced.
    expect(schema.components?.schemas?.ArrayOfMappedData).toStrictEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          mappingTypeName: { type: 'string' },
          sourceSystemValue: { type: 'string' },
          mappedValueID: { type: 'string' },
          mappedValue: { type: 'string' }
        },
        additionalProperties: false
      }
    });

    // Ensure that a circular $ref was **not** dereferenced.
    expect(circularRefs).toHaveLength(23);
    expect(schema.components?.schemas?.Customer?.properties?.customerNode).toStrictEqual({
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/CustomerNode",
      },
    });
  });

  it('should throw an error if "options.dereference.circular" is false', async () => {
    const parser = new $RefParser();

    try {
      await parser.dereference(path.rel("test/specs/circular-extensive/schema.json"), {
        dereference: { circular: false },
      });

      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(ReferenceError);
      expect(err.message).to.contain("Circular $ref pointer found at ");
      expect(err.message).to.contain("specs/circular-extensive/schema.json#/components/schemas/AssignmentExternalReference/properties/assignment/oneOf/0");

      // $Refs.circular should be true
      expect(parser.$refs.circular).to.equal(true);
    }
  });
});
