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
  describe("Detect unsafe URLs", () => {
    const unsafeUrls = [
      "http://localhost/schema.json",
      "http://localhost./schema.json",
      "http://127.0.0.1/schema.json",
      "http://0.0.0.0:9099/schema.json",
      "http://0.1.2.3/schema.json",
      "http://10.0.0.1/schema.json",
      "http://172.16.0.1/schema.json",
      "http://192.168.1.1/schema.json",
      "http://169.254.169.254/latest/meta-data/",
      "http://[::]/schema.json",
      "http://[::1]:9099/schema.json",
      "http://[0:0:0:0:0:0:0:1]:9099/schema.json",
      "http://[::ffff:127.0.0.1]:9099/schema.json",
      "http://[::ffff:7f00:1]:9099/schema.json",
      "http://[::ffff:169.254.169.254]/latest/meta-data/",
      "http://[::ffff:a9fe:a9fe]/latest/meta-data/",
      "http://[fc00::1]/schema.json",
      "http://[fe80::1]/schema.json",
      "http://service.local/schema.json",
    ];

    const safeUrls = [
      "https://example.com/schema.json",
      "https://api.example.com/schema.json",
      "https://8.8.8.8/schema.json",
      "https://[2001:4860:4860::8888]/schema.json",
    ];

    it.each(unsafeUrls)("should block %s", (unsafeUrl) => {
      expect($url.isUnsafeUrl(unsafeUrl)).to.equal(true);
    });

    it.each(safeUrls)("should allow %s", (safeUrl) => {
      expect($url.isUnsafeUrl(safeUrl)).to.equal(false);
    });
  });
}

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

    it("should treat forward-slash drive-letter paths as absolute", async () => {
      const result = $url.fromFileSystemPath("C:/A/Random/Path/file.json");
      expect(result)
        .to.be.a("string")
        .and.toSatisfy((msg: string) => msg.startsWith("C:/A/Random/Path/file.json"));
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
