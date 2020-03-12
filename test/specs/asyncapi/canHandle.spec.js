"use strict";

const $RefParser = require("../../..");

const { expect } = require("chai");
const { readFileSync } = require("fs");
const { join } = require("path");
const AJV = require("ajv");

describe("can process ayncapi schema so that AJV does not choke", () => {

  it("through dereferencing, ignoring circular references", async () => {
    const [schema, doc] = buildFixtures();

    const derefNoCircular = await $RefParser.dereference(
      schema,
      { dereference: { circular: "ignore" }},
    );

    validate(derefNoCircular, doc);
  });

  it("through bundling", async () => {
    const [schema, doc] = buildFixtures();

    const bundled = await $RefParser.bundle(
      schema,
    );

    validate(bundled, doc);
  });

  function validate (schema, doc) {
    const ajv = new AJV({
      allErrors: true,
      schemaId: "id",
      logger: false,
    });

    const validateFn = ajv.compile(schema);
    const isValid = validateFn(doc);

    expect(isValid).to.be.true;
    expect(validateFn.errors).to.be.null;
  }

  function buildFixtures () {
    const docPath = join(__dirname, "streetlights.json");
    const doc = JSON.parse(readFileSync(docPath, "utf8"));

    const schemaPath = join(__dirname, "schema.aas2.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

    return [schema, doc];
  }
});
