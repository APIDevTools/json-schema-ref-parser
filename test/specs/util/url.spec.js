import chai from "chai";
import chaiSubset from "chai-subset";
chai.use(chaiSubset);
const { expect } = chai;
import * as $url from "../../../lib/util/url.js";

describe("Return the extension of a URL", () => {
  it("should return an empty string if there isn't any extension", async () => {
    const extension = $url.getExtension("/file");
    expect(extension).to.equal("");
  });

  it("should return the extension in lowercase", async () => {
    const extension = $url.getExtension("/file.YML");
    expect(extension).to.equal(".yml");
  });

  it("should return the extension without the query", async () => {
    const extension = $url.getExtension("/file.yml?foo=bar");
    expect(extension).to.equal(".yml");
  });
});
