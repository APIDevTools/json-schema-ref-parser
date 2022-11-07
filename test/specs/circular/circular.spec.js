import { expect } from "chai";
import $RefParser, { dereference as _dereference } from "../../..";
import { testResolve, shouldNotGetCalled } from "../../utils/helper";
import { rel, abs } from "../../utils/path";
import { self, ancestor, indirect, indirectAncestor } from "./parsed";
import { self as _self, ancestor as _ancestor, indirect as _indirect, indirectAncestor as _indirectAncestor } from "./dereferenced";

describe("Schema with circular (recursive) $refs", () => {
  describe("$ref to self", () => {
    it("should parse successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.parse(rel("specs/circular/circular-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(self);
      expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular/circular-self.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should resolve successfully", testResolve(
      rel("specs/circular/circular-self.yaml"),
      abs("specs/circular/circular-self.yaml"), self
    ));

    it("should dereference successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular/circular-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it("should double dereference successfully", async () => {
      const firstPassSchema = await _dereference(rel("specs/circular/circular-self.yaml"));
      let parser = new $RefParser();
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should produce the same results if "options.$refs.circular" is "ignore"', async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular/circular-self.yaml"), { dereference: { circular: "ignore" }});
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_self);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
    });

    it('should throw an error if "options.$refs.circular" is false', async () => {
      let parser = new $RefParser();

      try {
        await parser.dereference(rel("specs/circular/circular-self.yaml"), { dereference: { circular: false }});
        shouldNotGetCalled();
      }
      catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular $ref pointer found at ");
        expect(err.message).to.contain("specs/circular/circular-self.yaml#/definitions/thing");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.bundle(rel("specs/circular/circular-self.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(self);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("$ref to ancestor", () => {
    it("should parse successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.parse(rel("specs/circular/circular-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(ancestor);
      expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular/circular-ancestor.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should resolve successfully", testResolve(
      rel("specs/circular/circular-ancestor.yaml"),
      abs("specs/circular/circular-ancestor.yaml"), ancestor
    ));

    it("should dereference successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular/circular-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_ancestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it("should double dereference successfully", async () => {
      let parser = new $RefParser();
      const firstPassSchema = await _dereference(rel("specs/circular/circular-ancestor.yaml"));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_ancestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular/circular-ancestor.yaml"), { dereference: { circular: "ignore" }});
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_ancestor.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.$refs.circular" is false', async () => {
      let parser = new $RefParser();

      try {
        await parser.dereference(rel("specs/circular/circular-ancestor.yaml"), { dereference: { circular: false }});
        shouldNotGetCalled();
      }
      catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular $ref pointer found at ");
        expect(err.message).to.contain("specs/circular/circular-ancestor.yaml#/definitions/person/properties/spouse");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.bundle(rel("specs/circular/circular-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(ancestor);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("indirect circular $refs", () => {
    it("should parse successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.parse(rel("specs/circular/circular-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(indirect);
      expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular/circular-indirect.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should resolve successfully", testResolve(
      rel("specs/circular/circular-indirect.yaml"),
      abs("specs/circular/circular-indirect.yaml"), indirect
    ));

    it("should dereference successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular/circular-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirect.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.parent.properties.children.items)
        .to.equal(schema.definitions.child);
      expect(schema.definitions.child.properties.parents.items)
        .to.equal(schema.definitions.parent);
    });

    it("should double dereference successfully", async () => {
      let parser = new $RefParser();
      const firstPassSchema = await _dereference(rel("specs/circular/circular-indirect.yaml"));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirect.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.parent.properties.children.items)
        .to.equal(schema.definitions.child);
      expect(schema.definitions.child.properties.parents.items)
        .to.equal(schema.definitions.parent);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular/circular-indirect.yaml"), { dereference: { circular: "ignore" }});
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirect.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.$refs.circular" is false', async () => {
      let parser = new $RefParser();

      try {
        await parser.dereference(rel("specs/circular/circular-indirect.yaml"), { dereference: { circular: false }});
        shouldNotGetCalled();
      }
      catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular $ref pointer found at ");
        expect(err.message).to.contain("specs/circular/circular-indirect.yaml#/definitions/child/properties/parents/items");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.bundle(rel("specs/circular/circular-indirect.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(indirect);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("indirect circular and ancestor $refs", () => {
    it("should parse successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.parse(rel("specs/circular/circular-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(indirectAncestor);
      expect(parser.$refs.paths()).to.deep.equal([abs("specs/circular/circular-indirect-ancestor.yaml")]);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });

    it("should resolve successfully", testResolve(
      rel("specs/circular/circular-indirect-ancestor.yaml"),
      abs("specs/circular/circular-indirect-ancestor.yaml"), indirectAncestor
    ));

    it("should dereference successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular/circular-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirectAncestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.parent.properties.child)
        .to.equal(schema.definitions.child);
      expect(schema.definitions.child.properties.children.items)
        .to.equal(schema.definitions.child);
    });

    it("should double dereference successfully", async () => {
      let parser = new $RefParser();
      const firstPassSchema = await parser.dereference(rel("specs/circular/circular-indirect-ancestor.yaml"));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirectAncestor.fullyDereferenced);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.parent.properties.child)
        .to.equal(schema.definitions.child);
      expect(schema.definitions.child.properties.children.items)
        .to.equal(schema.definitions.child);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async () => {
      let parser = new $RefParser();
      const schema = await parser.dereference(rel("specs/circular/circular-indirect-ancestor.yaml"), { dereference: { circular: "ignore" }});
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(_indirectAncestor.ignoreCircular$Refs);
      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      // Reference equality
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.$refs.circular" is false', async () => {
      let parser = new $RefParser();

      try {
        await parser.dereference(rel("specs/circular/circular-indirect-ancestor.yaml"), { dereference: { circular: false }});
        shouldNotGetCalled();
      }
      catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular $ref pointer found at ");
        expect(err.message).to.contain("specs/circular/circular-indirect-ancestor.yaml#/definitions/child/properties");

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
      }
    });

    it("should bundle successfully", async () => {
      let parser = new $RefParser();
      const schema = await parser.bundle(rel("specs/circular/circular-indirect-ancestor.yaml"));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(indirectAncestor);
      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
    });
  });

});
