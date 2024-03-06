import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as $url from "../../../lib/util/url.js";
import * as isWin from "../../../lib/util/is-windows";
import convertPathToPosix from "../../../lib/util/convert-path-to-posix";
import { cwd } from "../../../lib/util/url.js";
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

if (!process.env.BROWSER) {
  describe("Handle Windows file paths", () => {
    beforeAll(function (this: any) {
      vi.spyOn(isWin, "isWindows").mockReturnValue(true);
    });

    afterAll(function (this: any) {
      vi.restoreAllMocks();
    });

    it("should handle absolute paths", async () => {
      const result = $url.fromFileSystemPath("Y:\\A\\Random\\Path\\file.json");
      expect(result)
        .to.be.a("string")
        .and.toSatisfy((msg: string) => msg.startsWith("Y:/A/Random/Path"));
    });

    it("should handle relative paths", async () => {
      const result = $url.fromFileSystemPath("Path\\file.json");
      const pwd = convertPathToPosix(cwd());
      expect(result).to.be.a("string");
      expect(result).toSatisfy((msg: string) => msg.startsWith(pwd));
    });
  });
}

describe("Handle Linux file paths", () => {
  beforeAll(function (this: any) {
    //Force isWindows to always be false for this section of the test
    vi.spyOn(isWin, "isWindows").mockReturnValue(false);
  });

  afterAll(function (this: any) {
    vi.restoreAllMocks();
  });

  it("should handle absolute paths", async () => {
    const result = $url.fromFileSystemPath("/a/random/Path/file.json");
    expect(result)
      .to.be.a("string")
      .and.toSatisfy((msg: string) => msg.startsWith("/a/random/Path/file.json"));
  });

  it("should handle relative paths", async () => {
    const result = $url.fromFileSystemPath("Path/file.json");
    expect(result)
      .to.be.a("string")
      .and.toSatisfy((msg: string) => msg.startsWith("Path/file.json"));
  });
});
