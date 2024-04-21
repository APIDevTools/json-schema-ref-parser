import { describe, expect, it } from "vitest";
import $RefParser from "../../../../lib";
import path from "../../../utils/path";
import yaml from "js-yaml";
import fsp from "fs/promises";
import helper from "../../../utils/helper";
import { JSONParserError } from "../../../../lib/util/errors";

describe("Working directory", () => {
  it("should parse using the relative directory of the resolved file", async () => {
    const parser = new $RefParser();
    const schema = path.rel("test/specs/working-directory/api/example.yaml");
    await parser.dereference(schema);
  });
  it("should throw an error when parsing an in memory schema using relative paths", async () => {
    const parser = new $RefParser();
    const schema = path.rel("test/specs/working-directory/api/example.yaml");
    const contents = await fsp.readFile(schema, "utf-8");
    const parsed = await yaml.load(contents);
    try {
      await parser.dereference(parsed);
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(JSONParserError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Error");
    }
  });
});
