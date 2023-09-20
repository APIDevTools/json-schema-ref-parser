import { afterAll, beforeAll, describe, it } from "vitest";
import $RefParser, { JSONParserError } from "../../../lib/index.js";
import path from "../../utils/path.js";

import { expect, vi } from "vitest";
import helper from "../../utils/helper";

describe.skipIf(process.env.BROWSER)("Schemas with imports in relative and absolute locations work", () => {
  describe("Schemas with relative imports that should be resolved from the root", () => {
    beforeAll(() => {
      vi.spyOn(process, "cwd").mockImplementation(() => {
        return __dirname;
      });
    });
    afterAll(() => {
      vi.restoreAllMocks();
    });
    it("should not parse successfully when set to resolve relative (default)", async () => {
      const parser = new $RefParser();
      try {
        await parser.dereference(path.rel("schemas/accountList.json"));
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(JSONParserError);
      }
    });

    it("should parse successfully when set to resolve relative (default)", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("schemas/accountList.json"), {
        dereference: { externalReferenceResolution: "root" },
      });
      expect(schema).to.eql(parser.schema);
    });
  });

  describe("Schemas with relative imports that should be resolved relatively", () => {
    beforeAll(() => {
      vi.spyOn(process, "cwd").mockImplementation(() => {
        return __dirname;
      });
    });
    afterAll(() => {
      vi.restoreAllMocks();
    });
    it("should parse successfully when set to resolve relative (default)", async () => {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel("schemas-relative/accountList.json"), {
        dereference: { externalReferenceResolution: "relative" },
      });
      expect(schema).to.eql(parser.schema);
    });

    it("should not parse successfully when set to resolve relative (default)", async () => {
      const parser = new $RefParser();
      try {
        await parser.dereference(path.rel("schemas-relative/accountList.json"), {
          dereference: { externalReferenceResolution: "root" },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(JSONParserError);
      }
    });
  });
});
