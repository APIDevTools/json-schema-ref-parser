import { describe, it } from "vitest";
import { expect } from "vitest";
import $RefParser from "../../../lib/index.js";
import path from "../../utils/path";
import helper from "../../utils/helper";
import { TimeoutError } from "../../../lib/util/errors";

describe("Timeouts", () => {
  it("should throw error when timeout is reached", async () => {
    try {
      const parser = new $RefParser();
      await parser.dereference(path.rel("test/specs/timeout/timeout.yaml"), {
        timeoutMs: 0.01,
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(TimeoutError);
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      expect(err.message).to.contain("Dereferencing timeout reached");
    }
  });
});
