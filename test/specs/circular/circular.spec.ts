import { describe, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import helper from "../../utils/helper.js";
import path from "../../utils/path.js";
import parsedSchema from "./parsed.js";
import dereferencedSchema from "./dereferenced.js";

import { expect } from "vitest";

describe("Schema with circular (recursive) $refs", () => {
  describe("$ref to self", () => {
    it("should parse successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel("test/specs/circular/circular-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.self);
      expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/circular/circular-self.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/circular/circular-self.yaml"),
        path.abs("test/specs/circular/circular-self.yaml"),
        parsedSchema.self,
      ),
    );

    it("should dereference successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("test/specs/circular/circular-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it("should double dereference successfully", async () => {
      const firstPassSchema = await $RefParser.dereference(path.rel("test/specs/circular/circular-self.yaml"));
      const parser = new $RefParser();
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should produce the same results if "options.dereference.circular" is "ignore"', async () => {
      const parser = new $RefParser();

      const schema = await parser.dereference(path.rel("test/specs/circular/circular-self.yaml"), {
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
        await parser.dereference(path.rel("test/specs/circular/circular-self.yaml"), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Circular $ref pointer found at ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("specs/circular/circular-self.yaml#/definitions/thing");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should call onCircular if `options.dereference.onCircular` is present", async () => {
      const parser = new $RefParser();

      const circularRefs: string[] = [];
      const schema = await parser.dereference(path.rel("test/specs/circular/circular-self.yaml"), {
        dereference: {
          onCircular(path: string) {
            circularRefs.push(path);
          },
        },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(circularRefs).to.have.length(1);
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel("test/specs/circular/circular-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.self);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("$ref to ancestor", () => {
    it("should parse successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel("test/specs/circular/circular-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.ancestor);
      expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/circular/circular-ancestor.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/circular/circular-ancestor.yaml"),
        path.abs("test/specs/circular/circular-ancestor.yaml"),

        parsedSchema.ancestor,
      ),
    );

    it("should dereference successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("test/specs/circular/circular-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it("should double dereference successfully", async () => {
      const parser = new $RefParser();
      const firstPassSchema = await $RefParser.dereference(path.rel("test/specs/circular/circular-ancestor.yaml"));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should not dereference circular $refs if "options.dereference.circular" is "ignore"', async () => {
      const parser = new $RefParser();

      const schema = await parser.dereference(path.rel("test/specs/circular/circular-ancestor.yaml"), {
        dereference: { circular: "ignore" },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2339): Property 'definitions' does not exist on type 'voi... Remove this comment to see the full error message
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.dereference.circular" is false', async () => {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel("test/specs/circular/circular-ancestor.yaml"), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Circular $ref pointer found at ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("specs/circular/circular-ancestor.yaml#/definitions/person/properties/spouse");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel("test/specs/circular/circular-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.ancestor);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("indirect circular $refs", () => {
    it("should parse successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel("test/specs/circular/circular-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirect);
      expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/circular/circular-indirect.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/circular/circular-indirect.yaml"),
        path.abs("test/specs/circular/circular-indirect.yaml"),

        parsedSchema.indirect,
      ),
    );

    it("should dereference successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("test/specs/circular/circular-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
    });

    it("should double dereference successfully", async () => {
      const parser = new $RefParser();
      const firstPassSchema = await $RefParser.dereference(path.rel("test/specs/circular/circular-indirect.yaml"));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
    });

    it('should not dereference circular $refs if "options.dereference.circular" is "ignore"', async () => {
      const parser = new $RefParser();

      const schema = await parser.dereference(path.rel("test/specs/circular/circular-indirect.yaml"), {
        dereference: { circular: "ignore" },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2339): Property 'definitions' does not exist on type 'voi... Remove this comment to see the full error message
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.dereference.circular" is false', async () => {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel("test/specs/circular/circular-indirect.yaml"), {
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
          "specs/circular/circular-indirect.yaml#/definitions/child/properties/parents/items",
        );

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel("test/specs/circular/circular-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirect);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("indirect circular and ancestor $refs", () => {
    it("should parse successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel("test/specs/circular/circular-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirectAncestor);
      expect(parser.$refs.paths()).to.deep.equal([path.abs("test/specs/circular/circular-indirect-ancestor.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it(
      "should resolve successfully",
      helper.testResolve(
        path.rel("test/specs/circular/circular-indirect-ancestor.yaml"),
        path.abs("test/specs/circular/circular-indirect-ancestor.yaml"),

        parsedSchema.indirectAncestor,
      ),
    );

    it("should dereference successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("test/specs/circular/circular-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.parent.properties.child).to.equal(schema.definitions.child);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.children.items).to.equal(schema.definitions.child);
    });

    it("should double dereference successfully", async () => {
      const parser = new $RefParser();
      const firstPassSchema = await parser.dereference(path.rel("test/specs/circular/circular-indirect-ancestor.yaml"));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.parent.properties.child).to.equal(schema.definitions.child);
      // @ts-expect-error TS(2532): Object is possibly 'undefined'.
      expect(schema.definitions.child.properties.children.items).to.equal(schema.definitions.child);
    });

    it('should not dereference circular $refs if "options.dereference.circular" is "ignore"', async () => {
      const parser = new $RefParser();

      const schema = await parser.dereference(path.rel("test/specs/circular/circular-indirect-ancestor.yaml"), {
        dereference: { circular: "ignore" },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      // @ts-expect-error TS(2339): Property 'definitions' does not exist on type 'voi... Remove this comment to see the full error message
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.dereference.circular" is false', async () => {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel("test/specs/circular/circular-indirect-ancestor.yaml"), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("Circular $ref pointer found at ");
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
        expect(err.message).to.contain("specs/circular/circular-indirect-ancestor.yaml#/definitions/child/properties");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel("test/specs/circular/circular-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirectAncestor);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });
});
