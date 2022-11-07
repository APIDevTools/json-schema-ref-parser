import { expect } from "chai";
import $RefParser from "../../..";
import { testResolve, shouldNotGetCalled } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { self, thing, ancestor, personWithSpouse, pet, animals, indirect, parentWithChildren, childWithParents, indirectAncestor, parentWithChild, childWithChildren } from "./parsed";
import { self as _self, ancestor as _ancestor, indirect as _indirect, indirectAncestor as _indirectAncestor } from "./dereferenced";
import { self as __self, ancestor as __ancestor, indirect as __indirect, indirectAncestor as __indirectAncestor } from "./bundled";

describe("Schema with circular $refs that extend each other", () => {
  describe("$ref to self", () => {
    it("should parse successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.parse(rel("specs/circular-extended/circular-extended-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(self);
      expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular-extended/circular-extended-self.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should resolve successfully", testResolve(
      rel("specs/circular-extended/circular-extended-self.yaml"),
      abs("specs/circular-extended/circular-extended-self.yaml"), self,
      abs("specs/circular-extended/definitions/thing.yaml"), thing
    ));

    it("should dereference successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular-extended/circular-extended-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular-extended/circular-extended-self.yaml"), { dereference: { circular: "ignore" }});
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.$refs.circular" is false', async () => {
      let parser = new $RefParser();

      try {
        await parser.dereference(rel("specs/circular-extended/circular-extended-self.yaml"), { dereference: { circular: false }});
        shouldNotGetCalled();
      }
      catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular $ref pointer found at ");
        expect(err.message).to.contain("specs/circular-extended/circular-extended-self.yaml#/definitions/thing");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.bundle(rel("specs/circular-extended/circular-extended-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(__self);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("$ref to ancestor", () => {
    it("should parse successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.parse(rel("specs/circular-extended/circular-extended-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(ancestor);
      expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular-extended/circular-extended-ancestor.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should resolve successfully", testResolve(
      rel("specs/circular-extended/circular-extended-ancestor.yaml"),
      abs("specs/circular-extended/circular-extended-ancestor.yaml"), ancestor,
      abs("specs/circular-extended/definitions/person-with-spouse.yaml"), personWithSpouse,
      abs("specs/circular-extended/definitions/pet.yaml"), pet,
      abs("specs/circular-extended/definitions/animals.yaml"), animals
    ));

    it("should dereference successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular-extended/circular-extended-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_ancestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.person.properties.spouse.properties)
        .to.equal(schema.definitions.person.properties);
      expect(schema.definitions.person.properties.pet.properties)
        .to.equal(schema.definitions.pet.properties);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular-extended/circular-extended-ancestor.yaml"), { dereference: { circular: "ignore" }});
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_ancestor.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.$refs.circular" is false', async () => {
      let parser = new $RefParser();

      try {
        await parser.dereference(rel("specs/circular-extended/circular-extended-ancestor.yaml"), { dereference: { circular: false }});
        shouldNotGetCalled();
      }
      catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular $ref pointer found at ");
        expect(err.message).to.contain("specs/circular-extended/definitions/person-with-spouse.yaml#/properties/spouse");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.bundle(rel("specs/circular-extended/circular-extended-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(__ancestor);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("indirect circular $refs", () => {
    it("should parse successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.parse(rel("specs/circular-extended/circular-extended-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(indirect);
      expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular-extended/circular-extended-indirect.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should resolve successfully", testResolve(
      rel("specs/circular-extended/circular-extended-indirect.yaml"),
      abs("specs/circular-extended/circular-extended-indirect.yaml"), indirect,
      abs("specs/circular-extended/definitions/parent-with-children.yaml"), parentWithChildren,
      abs("specs/circular-extended/definitions/child-with-parents.yaml"), childWithParents,
      abs("specs/circular-extended/definitions/pet.yaml"), pet,
      abs("specs/circular-extended/definitions/animals.yaml"), animals
    ));

    it("should dereference successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular-extended/circular-extended-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirect.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.parent.properties.children.items.properties)
        .to.equal(schema.definitions.child.properties);
      expect(schema.definitions.child.properties.parents.items.properties)
        .to.equal(schema.definitions.parent.properties);
      expect(schema.definitions.child.properties.pet.properties)
        .to.equal(schema.definitions.pet.properties);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular-extended/circular-extended-indirect.yaml"), { dereference: { circular: "ignore" }});
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirect.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.$refs.circular" is false', async () => {
      let parser = new $RefParser();

      try {
        await parser.dereference(rel("specs/circular-extended/circular-extended-indirect.yaml"), { dereference: { circular: false }});
        shouldNotGetCalled();
      }
      catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular $ref pointer found at ");
        expect(err.message).to.contain("specs/circular-extended/definitions/child-with-parents.yaml#/properties/parents/items");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.bundle(rel("specs/circular-extended/circular-extended-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(__indirect);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("indirect circular and ancestor $refs", () => {
    it("should parse successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.parse(rel("specs/circular-extended/circular-extended-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(indirectAncestor);
      expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular-extended/circular-extended-indirect-ancestor.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should resolve successfully", testResolve(
      rel("specs/circular-extended/circular-extended-indirect-ancestor.yaml"),
      abs("specs/circular-extended/circular-extended-indirect-ancestor.yaml"), indirectAncestor,
      abs("specs/circular-extended/definitions/parent-with-child.yaml"), parentWithChild,
      abs("specs/circular-extended/definitions/child-with-children.yaml"), childWithChildren,
      abs("specs/circular-extended/definitions/pet.yaml"), pet,
      abs("specs/circular-extended/definitions/animals.yaml"), animals
    ));

    it("should dereference successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular-extended/circular-extended-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirectAncestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.parent.properties.child.properties)
        .to.equal(schema.definitions.child.properties);
      expect(schema.definitions.child.properties.children.items.properties)
        .to.equal(schema.definitions.child.properties);
      expect(schema.definitions.pet.properties)
        .to.equal(schema.definitions.child.properties.pet.properties);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular-extended/circular-extended-indirect-ancestor.yaml"), { dereference: { circular: "ignore" }});
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirectAncestor.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.$refs.circular" is false', async () => {
      let parser = new $RefParser();

      try {
        await parser.dereference(rel("specs/circular-extended/circular-extended-indirect-ancestor.yaml"), { dereference: { circular: false }});
        shouldNotGetCalled();
      }
      catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular $ref pointer found at ");
        expect(err.message).to.contain("specs/circular-extended/definitions/child-with-children.yaml#/properties");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.bundle(rel("specs/circular-extended/circular-extended-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(__indirectAncestor);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

});
