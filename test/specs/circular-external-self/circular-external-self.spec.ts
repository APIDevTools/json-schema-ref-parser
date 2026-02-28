import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path.js";

describe("Circular $ref to self via filename vs hash", () => {
  it("should dereference $ref: '#' with circular reference at top level", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/circular-external-self/recursive-self.json"));

    expect(parser.$refs.circular).to.equal(true);
    // When using $ref: "#", the value property should directly be a circular reference to the schema itself
    expect(schema.properties.value).to.equal(schema);
  });

  it("should dereference $ref: 'recursive-filename.json' with circular reference at top level", async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel("test/specs/circular-external-self/recursive-filename.json"));

    expect(parser.$refs.circular).to.equal(true);
    // When using $ref: "recursive-filename.json", the value property should ALSO directly
    // be a circular reference to the schema itself (not one level too deep)
    // Issue #378: this was producing schema.properties.value !== schema (one level too deep)
    expect(schema.properties.value).to.equal(schema);
  });
});
