import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";
import bundledSchema from "./bundled.js";

import { expect } from "vitest";

describe("Schema with circular $refs that extend each other", () => {
  describe("$ref to self", () => {
    it("should parse successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel("test/specs/circular-extended/circular-extended-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.self);
      expect(parser.$refs.paths()).to.deep.equal([
        path.abs("test/specs/circular-extended/circular-extended-self.yaml"),
      ]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/circular-extended/circular-extended-self.yaml"),
        path.abs("test/specs/circular-extended/circular-extended-self.yaml"),
        parsedSchema.self,
        path.abs("test/specs/circular-extended/definitions/thing.yaml"),
        parsedSchema.thing,
      ),
    );

    it("should dereference successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("test/specs/circular-extended/circular-extended-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should not dereference circular $refs if "options.dereference.circular" is "ignore"', async () => {
      const parser = new $RefParser();

      const schema = await parser.dereference(path.rel("test/specs/circular-extended/circular-extended-self.yaml"), {
        dereference: { circular: "ignore" },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.dereference.circular" is false', async () => {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel("test/specs/circular-extended/circular-extended-self.yaml"), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Circular $ref pointer found at ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("specs/circular-extended/circular-extended-self.yaml#/definitions/thing");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel("test/specs/circular-extended/circular-extended-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(bundledSchema.self);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("$ref to ancestor", () => {
    it("should parse successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel("test/specs/circular-extended/circular-extended-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.ancestor);
      expect(parser.$refs.paths()).to.deep.equal([
        path.abs("test/specs/circular-extended/circular-extended-ancestor.yaml"),
      ]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/circular-extended/circular-extended-ancestor.yaml"),
        path.abs("test/specs/circular-extended/circular-extended-ancestor.yaml"),
        parsedSchema.ancestor,
        path.abs("test/specs/circular-extended/definitions/person-with-spouse.yaml"),
        parsedSchema.personWithSpouse,
        path.abs("test/specs/circular-extended/definitions/pet.yaml"),
        parsedSchema.pet,
        path.abs("test/specs/circular-extended/definitions/animals.yaml"),
        parsedSchema.animals,
      ),
    );

    it("should dereference successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("test/specs/circular-extended/circular-extended-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.person.properties.spouse.properties).to.equal(schema.definitions.person.properties);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.person.properties.pet.properties).to.equal(schema.definitions.pet.properties);
    });

    it('should not dereference circular $refs if "options.dereference.circular" is "ignore"', async () => {
      const parser = new $RefParser();

      const schema = await parser.dereference(
        path.rel("test/specs/circular-extended/circular-extended-ancestor.yaml"),
        {
          dereference: { circular: "ignore" },
        },
      );
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.dereference.circular" is false', async () => {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel("test/specs/circular-extended/circular-extended-ancestor.yaml"), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Circular $ref pointer found at ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain(
          "specs/circular-extended/definitions/person-with-spouse.yaml#/properties/spouse",
        );

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel("test/specs/circular-extended/circular-extended-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(bundledSchema.ancestor);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("indirect circular $refs", () => {
    it("should parse successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel("test/specs/circular-extended/circular-extended-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirect);
      expect(parser.$refs.paths()).to.deep.equal([
        path.abs("test/specs/circular-extended/circular-extended-indirect.yaml"),
      ]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/circular-extended/circular-extended-indirect.yaml"),
        path.abs("test/specs/circular-extended/circular-extended-indirect.yaml"),
        parsedSchema.indirect,
        path.abs("test/specs/circular-extended/definitions/parent-with-children.yaml"),
        parsedSchema.parentWithChildren,
        path.abs("test/specs/circular-extended/definitions/child-with-parents.yaml"),
        parsedSchema.childWithParents,
        path.abs("test/specs/circular-extended/definitions/pet.yaml"),
        parsedSchema.pet,
        path.abs("test/specs/circular-extended/definitions/animals.yaml"),
        parsedSchema.animals,
      ),
    );

    it("should dereference successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("test/specs/circular-extended/circular-extended-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.parent.properties.children.items.properties).to.equal(
        // @ts-expect-error TS(2532): Object is possibly 'undefined'.
        schema.definitions.child.properties,
      );
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.parents.items.properties).to.equal(
        // @ts-expect-error TS(2532): Object is possibly 'undefined'.
        schema.definitions.parent.properties,
      );
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.pet.properties).to.equal(schema.definitions.pet.properties);
    });

    it('should not dereference circular $refs if "options.dereference.circular" is "ignore"', async () => {
      const parser = new $RefParser();

      const schema = await parser.dereference(
        path.rel("test/specs/circular-extended/circular-extended-indirect.yaml"),
        {
          dereference: { circular: "ignore" },
        },
      );
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.dereference.circular" is false', async () => {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel("test/specs/circular-extended/circular-extended-indirect.yaml"), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Circular $ref pointer found at ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain(
          "specs/circular-extended/definitions/child-with-parents.yaml#/properties/parents/items",
        );

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel("test/specs/circular-extended/circular-extended-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(bundledSchema.indirect);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("indirect circular and ancestor $refs", () => {
    it("should parse successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.parse(
        path.rel("test/specs/circular-extended/circular-extended-indirect-ancestor.yaml"),
      );
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirectAncestor);
      expect(parser.$refs.paths()).to.deep.equal([
        path.abs("test/specs/circular-extended/circular-extended-indirect-ancestor.yaml"),
      ]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/circular-extended/circular-extended-indirect-ancestor.yaml"),
        path.abs("test/specs/circular-extended/circular-extended-indirect-ancestor.yaml"),
        parsedSchema.indirectAncestor,
        path.abs("test/specs/circular-extended/definitions/parent-with-child.yaml"),
        parsedSchema.parentWithChild,
        path.abs("test/specs/circular-extended/definitions/child-with-children.yaml"),
        parsedSchema.childWithChildren,
        path.abs("test/specs/circular-extended/definitions/pet.yaml"),
        parsedSchema.pet,
        path.abs("test/specs/circular-extended/definitions/animals.yaml"),
        parsedSchema.animals,
      ),
    );

    it("should dereference successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(
        path.rel("test/specs/circular-extended/circular-extended-indirect-ancestor.yaml"),
      );
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.parent.properties.child.properties).to.equal(schema.definitions.child.properties);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.children.items.properties).to.equal(
        // @ts-expect-error TS(2532): Object is possibly 'undefined'.
        schema.definitions.child.properties,
      );
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.pet.properties).to.equal(schema.definitions.child.properties.pet.properties);
    });

    it('should not dereference circular $refs if "options.dereference.circular" is "ignore"', async () => {
      const parser = new $RefParser();

      const schema = await parser.dereference(
        path.rel("test/specs/circular-extended/circular-extended-indirect-ancestor.yaml"),
        { dereference: { circular: "ignore" } },
      );
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.dereference.circular" is false', async () => {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel("test/specs/circular-extended/circular-extended-indirect-ancestor.yaml"), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Circular $ref pointer found at ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("specs/circular-extended/definitions/child-with-children.yaml#/properties");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.bundle(
        path.rel("test/specs/circular-extended/circular-extended-indirect-ancestor.yaml"),
      );
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(bundledSchema.indirectAncestor);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });
});
