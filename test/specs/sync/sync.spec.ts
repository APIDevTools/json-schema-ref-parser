import { describe, it, expect } from "vitest";
import $RefParser, { bundleSync, dereferenceSync } from "../../../lib/index.js";

function internalRefsSchema() {
  return {
    type: "object",
    definitions: {
      name: {
        title: "name",
        type: "string",
      },
      person: {
        type: "object",
        properties: {
          name: { $ref: "#/definitions/name" },
        },
      },
    },
    properties: {
      name: { $ref: "#/definitions/name" },
      person: { $ref: "#/definitions/person" },
    },
  };
}

describe("dereferenceSync", () => {
  it("should dereference a schema object with internal $refs", () => {
    const parser = new $RefParser();
    const schema = parser.dereferenceSync(internalRefsSchema());

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      type: "object",
      definitions: {
        name: {
          title: "name",
          type: "string",
        },
        person: {
          type: "object",
          properties: {
            name: { title: "name", type: "string" },
          },
        },
      },
      properties: {
        name: { title: "name", type: "string" },
        person: {
          type: "object",
          properties: {
            name: { title: "name", type: "string" },
          },
        },
      },
    });

    // Reference equality, same as the async dereference
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name).to.equal(schema.definitions.name);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.person.properties.name).to.equal(schema.definitions.name);

    expect(parser.$refs.circular).to.equal(false);
  });

  it("should be callable as a static method", () => {
    const schema = $RefParser.dereferenceSync(internalRefsSchema());

    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name).to.deep.equal({ title: "name", type: "string" });
  });

  it("should be callable as a named export", () => {
    const schema = dereferenceSync(internalRefsSchema());

    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name).to.deep.equal({ title: "name", type: "string" });
  });

  it("should throw when given a file path instead of a schema object", () => {
    const parser = new $RefParser();

    expect(() => parser.dereferenceSync("test/specs/internal/internal.yaml")).to.throw(
      "Expected a schema object. dereferenceSync only supports schema objects; to dereference a file path or URL, use the asynchronous dereference method instead",
    );
  });

  it("should throw when the schema contains an external $ref", () => {
    const parser = new $RefParser();
    const schema = {
      type: "object",
      properties: {
        person: { $ref: "definitions/person.yaml" },
      },
    };

    expect(() => parser.dereferenceSync(schema)).to.throw(
      'Cannot resolve external reference "definitions/person.yaml" synchronously; use the asynchronous dereference method instead',
    );
  });

  it("should dereference circular internal $refs and set the circular flag", () => {
    const parser = new $RefParser();
    const schema = parser.dereferenceSync({
      definitions: {
        person: {
          type: "object",
          properties: {
            name: { type: "string" },
            spouse: { $ref: "#/definitions/person" },
          },
        },
      },
    });

    expect(parser.$refs.circular).to.equal(true);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
  });

  it("should dereference a compound document with embedded schema resources", () => {
    const parser = new $RefParser();
    const schema = parser.dereferenceSync({
      $id: "https://example.com/schemas/customer",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        shipping_address: { $ref: "/schemas/address" },
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
    });

    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.shipping_address).to.equal(schema.$defs.address);
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.$defs.address.properties.state).to.deep.equal({ enum: ["CA", "NY"] });
  });

  it("should produce the same result as the asynchronous dereference method", async () => {
    const compoundSchema = () => ({
      $id: "https://example.com/schemas/customer",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        shipping_address: { $ref: "/schemas/address" },
        name: { $ref: "#/$defs/name" },
      },
      $defs: {
        name: { type: "string" },
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
    });

    const syncResult = new $RefParser().dereferenceSync(compoundSchema());
    const asyncResult = await new $RefParser().dereference(compoundSchema());

    expect(syncResult).to.deep.equal(asyncResult);
  });
});

describe("bundleSync", () => {
  it("should produce the same result as the asynchronous bundle method", async () => {
    const syncResult = new $RefParser().bundleSync(internalRefsSchema());
    const asyncResult = await new $RefParser().bundle(internalRefsSchema());

    expect(syncResult).to.deep.equal(asyncResult);
  });

  it("should preserve references to embedded schema resources", () => {
    const parser = new $RefParser();
    const schema = parser.bundleSync({
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
    });

    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.shipping_address.$ref).to.equal("/schemas/address");
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.billing_address.$ref).to.equal("/schemas/address");
    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.$defs.address.properties.state.$ref).to.equal("#/definitions/state");
  });

  it("should throw when the schema contains an external $ref", () => {
    const parser = new $RefParser();
    const schema = {
      type: "object",
      properties: {
        person: { $ref: "http://example.com/definitions/person.json" },
      },
    };

    expect(() => parser.bundleSync(schema)).to.throw(
      'Cannot resolve external reference "http://example.com/definitions/person.json" synchronously; use the asynchronous bundle method instead',
    );
  });

  it("should throw when given a file path instead of a schema object", () => {
    const parser = new $RefParser();

    expect(() => parser.bundleSync("test/specs/internal/internal.yaml")).to.throw(
      "Expected a schema object. bundleSync only supports schema objects; to bundle a file path or URL, use the asynchronous bundle method instead",
    );
  });

  it("should be callable as a static method", () => {
    const schema = $RefParser.bundleSync(internalRefsSchema());

    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name).to.deep.equal({ $ref: "#/definitions/name" });
  });

  it("should be callable as a named export", () => {
    const schema = bundleSync(internalRefsSchema());

    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    expect(schema.properties.name).to.deep.equal({ $ref: "#/definitions/name" });
  });
});
