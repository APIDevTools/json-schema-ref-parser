"use strict";

const { expect } = require("chai");
const $RefParser = require("../../lib");

describe("YAML object", () => {
  describe("parse", () => {
    it("should parse an object", async () => {
      let obj = $RefParser.YAML.parse(
        "title: person\n" +
        "required:\n" +
        "  - name\n" +
        "  - age\n" +
        "properties:\n" +
        "  name:\n" +
        "    type: string\n" +
        "  age:\n" +
        "    type: number"
      );

      expect(obj).to.deep.equal({
        title: "person",
        required: ["name", "age"],
        properties: {
          name: {
            type: "string"
          },
          age: {
            type: "number"
          }
        }
      });
    });

    it("should parse a string", async () => {
      let str = $RefParser.YAML.parse("hello, world");
      expect(str).to.equal("hello, world");
    });

    it("should parse a number", async () => {
      let str = $RefParser.YAML.parse("42");
      expect(str).to.be.a("number").equal(42);
    });
  });

  describe("stringify", () => {
    it("should stringify an object", async () => {
      let yaml = $RefParser.YAML.stringify({
        title: "person",
        required: ["name", "age"],
        properties: {
          name: {
            type: "string"
          },
          age: {
            type: "number"
          }
        }
      });

      expect(yaml).to.equal(
        "title: person\n" +
        "required:\n" +
        "  - name\n" +
        "  - age\n" +
        "properties:\n" +
        "  name:\n" +
        "    type: string\n" +
        "  age:\n" +
        "    type: number\n"
      );
    });

    it("should support a custom indent (as a string)", async () => {
      let yaml = $RefParser.YAML.stringify({
        title: "person",
        required: ["name", "age"],
        properties: {
          name: {
            type: "string"
          },
          age: {
            type: "number"
          }
        }
      }, null, "     ");

      expect(yaml).to.equal(
        "title: person\n" +
        "required:\n" +
        "     - name\n" +
        "     - age\n" +
        "properties:\n" +
        "     name:\n" +
        "          type: string\n" +
        "     age:\n" +
        "          type: number\n"
      );
    });

    it("should support a custom indent (as a number)", async () => {
      let yaml = $RefParser.YAML.stringify({
        title: "person",
        required: ["name", "age"],
        properties: {
          name: {
            type: "string"
          },
          age: {
            type: "number"
          }
        }
      }, null, 10);

      expect(yaml).to.equal(
        "title: person\n" +
        "required:\n" +
        "          - name\n" +
        "          - age\n" +
        "properties:\n" +
        "          name:\n" +
        "                    type: string\n" +
        "          age:\n" +
        "                    type: number\n"
      );
    });

    it("should stringify a string", async () => {
      let yaml = $RefParser.YAML.stringify("hello, world");
      expect(yaml).to.equal("'hello, world'\n");
    });

    it("should stringify a number", async () => {
      let yaml = $RefParser.YAML.stringify(42);
      expect(yaml).to.equal("42\n");
    });
  });
});
