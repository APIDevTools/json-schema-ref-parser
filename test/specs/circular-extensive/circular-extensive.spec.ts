import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";

describe("Schema with an extensive amount of circular $refs", () => {
  it("should dereference successfully", async () => {
    const circularRefs = new Set<string>();

    const parser = new $RefParser<Record<string, any>>();
    const schema = await parser.dereference(path.rel("test/specs/circular-extensive/schema.json"), {
      dereference: {
        onCircular: (ref: string) => circularRefs.add(ref),
      },
    });

    // Ensure that a non-circular $ref was dereferenced.
    expect(schema.components?.schemas?.ArrayOfMappedData).toStrictEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          mappingTypeName: { type: "string" },
          sourceSystemValue: { type: "string" },
          mappedValueID: { type: "string" },
          mappedValue: { type: "string" },
        },
        additionalProperties: false,
      },
    });

    // With circular: true (default), circular $refs are replaced with the resolved object.
    // onCircular fires for each $ref location pointing to a circular target (118 unique paths).
    expect(circularRefs.size).toBe(118);
    expect(schema.components?.schemas?.Customer?.properties?.customerNode).toStrictEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          customerNodeGuid: expect.any(Object),
          customerGuid: expect.any(Object),
          nodeId: expect.any(Object),
          customerGu: expect.any(Object),
        },
        additionalProperties: false,
      },
    });
  });

  it("should dereference successfully with `dereference.circular` is `ignore`", async () => {
    const circularRefs = new Set<string>();

    const parser = new $RefParser<Record<string, any>>();
    const schema = await parser.dereference(path.rel("test/specs/circular-extensive/schema.json"), {
      dereference: {
        onCircular: (ref: string) => circularRefs.add(ref),
        circular: "ignore",
      },
    });

    // Ensure that a non-circular $ref was dereferenced.
    expect(schema.components?.schemas?.ArrayOfMappedData).toStrictEqual({
      type: "array",
      items: {
        type: "object",
        properties: {
          mappingTypeName: { type: "string" },
          sourceSystemValue: { type: "string" },
          mappedValueID: { type: "string" },
          mappedValue: { type: "string" },
        },
        additionalProperties: false,
      },
    });

    // With circular: 'ignore', circular $refs remain as { $ref: "..." } objects.
    // onCircular fires for each $ref location (same 118 paths as above), PLUS 55 additional
    // "interior paths" - $refs inside circular schemas that get re-encountered when the
    // containing schema is accessed from multiple entry points.
    expect(circularRefs.size).toBe(173);
    expect(schema.components?.schemas?.Customer?.properties?.customerNode).toStrictEqual({
      type: "array",
      items: {
        $ref: "#/components/schemas/CustomerNode",
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
      expect(err.message).to.contain(
        "specs/circular-extensive/schema.json#/components/schemas/AssignmentExternalReference/properties/assignment/oneOf/0",
      );

      // $Refs.circular should be true
      expect(parser.$refs.circular).to.equal(true);
    }
  });

  it("should expose path differences between circular: true and circular: 'ignore'", async () => {
    const SCHEMA_PATH = "test/specs/circular-extensive/schema.json";

    // Collect paths with circular: true (default)
    const pathsTrue = new Set<string>();
    await new $RefParser().dereference(path.rel(SCHEMA_PATH), {
      dereference: {
        onCircular: (ref: string) => pathsTrue.add(ref.split("#")[1]),
      },
    });

    // Collect paths with circular: 'ignore'
    const pathsIgnore = new Set<string>();
    await new $RefParser().dereference(path.rel(SCHEMA_PATH), {
      dereference: {
        circular: "ignore",
        onCircular: (ref: string) => pathsIgnore.add(ref.split("#")[1]),
      },
    });

    // Verify the counts
    expect(pathsTrue.size).toBe(118);
    expect(pathsIgnore.size).toBe(173);

    // All paths in 'true' mode should also be in 'ignore' mode
    const pathsOnlyInTrue = [...pathsTrue].filter((p) => !pathsIgnore.has(p));
    expect(pathsOnlyInTrue).toHaveLength(0);

    // 'ignore' mode has 55 additional paths not found in 'true' mode
    const pathsOnlyInIgnore = [...pathsIgnore].filter((p) => !pathsTrue.has(p));
    expect(pathsOnlyInIgnore).toHaveLength(55);

    // These extra paths are "interior paths" within circular schemas that get
    // re-visited because $ref objects allow re-entry from different traversal routes.
    // With circular: true, these paths aren't reported because the same object
    // instance is detected by parents.has() which doesn't trigger onCircular.
    //
    // Example extra paths (interior of circular schemas reached via different routes):
    // Customer contains customerNode.items → CustomerNode (circular).
    // - In 'true' mode: Customer.customerNode.items becomes the resolved CustomerNode object.
    //   When Customer is accessed from another route, customerNode.items is the same object
    //   instance already in `parents`, so no onCircular fires for that interior path.
    // - In 'ignore' mode: Customer.customerNode.items remains { $ref: "..." }.
    //   When Customer is accessed from another route, the $ref is re-encountered and
    //   triggers onCircular via cache hit, reporting the interior path.
    expect(pathsOnlyInIgnore).toContain("/components/schemas/Customer/properties/customerNode/items");
    expect(pathsOnlyInIgnore).toContain("/components/schemas/Customer/properties/customerExternalReference/items");
    expect(pathsOnlyInIgnore).toContain("/components/schemas/Node/properties/configWcCodeNode/items");
  });
});
