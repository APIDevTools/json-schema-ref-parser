import { host } from "@jsdevtools/host-environment";

const isWindows = /^win/.test(globalThis.process?.platform);
const getPathFromOs = filePath => isWindows ? filePath.replace(/\\/g, "/") : filePath;

const { rel, abs, unixify, url, cwd } = host.node ? filesystemPathHelpers() : urlPathHelpers();

export { rel, abs, unixify, url, cwd };

/**
 * Helper functions for getting local filesystem paths in various formats
 */
function filesystemPathHelpers () {
  // TODO should be using this syntax but that has to go at top of the file?
  // import { normalize, join, resolve, sep } from "path";
  // import { format } from "url";

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { normalize, join, resolve, sep } = require("path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { format } = require("url");

  const testsDir = resolve(__dirname, "..");

  // Run all tests from the "test" directory
  process.chdir(testsDir);

  return {
    /**
     * Returns the relative path of a file in the "test" directory
     */
    rel (file) {
      const relativePath = normalize(join(file));
      const filePath = isWindows ? resolve(relativePath) : relativePath;
      return getPathFromOs(filePath);
    },

    /**
     * Returns the absolute path of a file in the "test" directory
     */
    abs (file) {
      const absolutePath = resolve(join(file || sep));
      return getPathFromOs(absolutePath);
    },

    /**
     * Returns the path with normalized, UNIX-like, slashes. Disk letter is lower-cased, if present.
     */
    unixify (file) {
      return file.replace(/\\/g, "/").replace(/^[A-Z](?=:\/)/, (letter) => letter.toLowerCase());
    },

    /**
     * Returns the path of a file in the "test" directory as a URL.
     * (e.g. "file://path/to/json-schema-ref-parser/test/files...")
     */
    url (file) {
      let pathname = path.abs(file);

      if (host.os.windows) {
        pathname = pathname.replace(/\\/g, "/");  // Convert Windows separators to URL separators
      }

      let url = format({
        protocol: "file:",
        slashes: true,
        pathname
      });

      return url;
    },

    /**
     * Returns the absolute path of the current working directory.
     */
    cwd () {
      return getPathFromOs(join(process.cwd(), sep));
    }
  };
}

/**
 * Helper functions for getting URLs in various formats
 */
function urlPathHelpers () {
  // Get the URL of the "test" directory
  let filename = document.querySelector('script[src*="/fixtures/"]').src;
  let testsDir = filename.substr(0, filename.indexOf("/fixtures/")) + "/";

  /**
   * URI-encodes the given file name
   */
  function encodePath (file) {
    return encodeURIComponent(file).split("%2F").join("/");
  }

  return {
    /**
     * Returns the relative path of a file in the "test" directory
     *
     * NOTE: When running in Karma the absolute path is returned instead
     */
    rel (file) {
      // Encode special characters in paths
      file = encodePath(file);

      if (window.location.href.indexOf(testsDir) === 0) {
        // We're running from the "/test/index.html" page, directly in a browser.
        // So return the relative path from the "test" directory.
        return file;
      }
      else {
        // We're running in Karma, so return an absolute path,
        // since we don't know the relative path of the "test" directory.
        return testsDir.replace(/^https?:\/\/[^\/]+(\/.*)/, "$1" + file);
      }
    },

    /**
     * Returns the absolute path of a file in the "test" directory
     */
    abs (file) {
      return testsDir + encodePath(file);
    },

    /**
     * Does nothing. Needed to comply with Filesystem path helpers.
     */
    unixify (file) {
      return file;
    },
    /**
     * Returns the path of a file in the "test" directory as an absolute URL.
     * (e.g. "http://localhost/test/files/...")
     */
    url (file) {
      return path.abs(file);
    },

    /**
     * Returns the path of the current page.
     */
    cwd () {
      return location.href;
    }
  };
}
