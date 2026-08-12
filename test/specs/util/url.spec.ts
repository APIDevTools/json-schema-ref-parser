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

  it("should return the extension without the hash", () => {
    expect($url.getExtension("/file.yml#section.json")).to.equal(".yml");
  });

  it("should ignore dots in query strings and hashes", () => {
    expect($url.getExtension("/file?format=.json")).to.equal("");
    expect($url.getExtension("/file#section.json")).to.equal("");
    expect($url.getExtension("https://example.com/schema")).to.equal("");
  });
});

describe("Resolve URL fragments", () => {
  it("should preserve literal percent signs without throwing", () => {
    expect($url.resolve("https://example.com/schema.json", "#/properties/rate%")).to.equal(
      "https://example.com/schema.json#/properties/rate%",
    );
  });

  it("should decode valid escapes alongside literal percent signs", () => {
    expect($url.resolve("https://example.com/schema.json", "#/properties/a%2Fb%")).to.equal(
      "https://example.com/schema.json#/properties/a/b%",
    );
  });

  it("should fall back safely for malformed UTF-8 escapes", () => {
    expect($url.resolve("https://example.com/schema.json", "#/properties/bad%E0%A4%A")).to.equal(
      "https://example.com/schema.json#/properties/bad%E0%A4%A",
    );
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

  it("should treat the file URL scheme case-insensitively", () => {
    expect($url.toFileSystemPath("FILE:///a/random/Path/file.json")).to.equal("/a/random/Path/file.json");
  });
});

describe("Round-trip special characters in filesystem paths", () => {
  // POSIX-only: on Windows, fromFileSystemPath prepends cwd() and normalizes
  // separators, so these absolute-POSIX-path assertions don't hold. Mocked the
  // same way as the "Handle Linux file paths" block above.
  beforeAll(function (this: any) {
    vi.spyOn(isWin, "isWindows").mockReturnValue(false);
  });

  afterAll(function (this: any) {
    vi.restoreAllMocks();
  });

  it("should round-trip a literal question mark", () => {
    const original = "/a/random/Path/defs?1.json";
    const encoded = $url.fromFileSystemPath(original);
    expect(encoded).to.equal("/a/random/Path/defs%3F1.json");
    expect($url.toFileSystemPath(encoded)).to.equal(original);
  });

  it("should round-trip a literal hash", () => {
    const original = "/a/random/Path/defs#1.json";
    const encoded = $url.fromFileSystemPath(original);
    expect(encoded).to.equal("/a/random/Path/defs%231.json");
    expect($url.toFileSystemPath(encoded)).to.equal(original);
  });

  it("should round-trip a filename that literally contains the text '%3F' without double-decoding it", () => {
    // Regression test (jonluca, PR review 2026-08-07): a filename whose NAME is the
    // literal text "%3F" (percent, 3, F -- not an encoded "?") must not be silently
    // read as the "?" sibling file. fromFileSystemPath escapes the literal "%" to
    // "%25", producing "%253F" -- if toFileSystemPath decoded %25->% before consuming
    // reserved escapes, the revealed "%3F" text would wrongly decode to "?" a second
    // time. It must decode back to the exact original literal text instead.
    const original = "/a/random/Path/defs%3F1.json";
    const encoded = $url.fromFileSystemPath(original);
    expect(encoded).to.equal("/a/random/Path/defs%253F1.json");
    expect($url.toFileSystemPath(encoded)).to.equal(original);
    // And the two filenames must remain distinguishable -- this is the actual bug:
    // parsing the encoded literal-%3F path must NOT collapse onto the "?" sibling.
    const questionMarkOriginal = "/a/random/Path/defs?1.json";
    expect($url.toFileSystemPath(encoded)).to.not.equal(questionMarkOriginal);
  });

  it("should decode a lowercase %3f the same as uppercase %3F (RFC 3986 §2.1: hex digits are case-insensitive)", () => {
    const original = "/a/random/Path/defs?1.json";
    expect($url.toFileSystemPath("/a/random/Path/defs%3f1.json")).to.equal(original);
    expect($url.toFileSystemPath("/a/random/Path/defs%3F1.json")).to.equal(original);
  });
});
