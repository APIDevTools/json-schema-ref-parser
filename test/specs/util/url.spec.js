import chai, { use } from "chai";
import chaiSubset from "chai-subset";
use(chaiSubset);
const { expect } = chai;
import { getExtension } from "../../../lib/util/url";

describe("Return the extension of a URL", () => {
  it("should return an empty string if there isn't any extension", async () => {
    const extension = getExtension("/file");
    expect(extension).to.equal("");
  });

  it("should return the extension in lowercase", async () => {
    const extension = getExtension("/file.YML");
    expect(extension).to.equal(".yml");
  });

  it("should return the extension without the query", async () => {
    const extension = getExtension("/file.yml?foo=bar");
    expect(extension).to.equal(".yml");
  });
});
