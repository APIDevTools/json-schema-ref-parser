/// <reference lib="dom" />

import nodePath from "path";
import { isWindows } from "../../lib/util/is-windows";
import convertPathToPosix from "../../lib/util/convert-path-to-posix";

const isDom = typeof window !== "undefined" && typeof window.document !== "undefined";

const pathHelpers = {
  filesystem: filesystemPathHelpers(),
  url: urlPathHelpers(),
};

/**
 * Helper functions for getting local filesystem paths in various formats
 */
function filesystemPathHelpers() {
  // Run all tests from the "test" directory
  const path = {
    /**
     * Returns the relative path of a file in the "test" directory
     */
    rel(file: any) {
      const relativePath = nodePath.normalize(nodePath.join(file));
      const filePath = isWindows() ? nodePath.resolve(relativePath) : relativePath;
      return convertPathToPosix(filePath);
    },

    /**
     * Returns the absolute path of a file in the "test" directory
     */
    abs(file: any) {
      const absolutePath = nodePath.resolve(nodePath.join(file || nodePath.sep));
      return convertPathToPosix(absolutePath);
    },

    /**
     * Returns the path with normalized, UNIX-like, slashes. Disk letter is lower-cased, if present.
     */
    unixify(file: string) {
      return convertPathToPosix(file).replace(/^[A-Z](?=:\/)/, (letter: any) => letter.toLowerCase());
    },

    /**
     * Returns the path of a file in the "test" directory as a URL.
     * (e.g. "file://path/to/json-schema-ref-parser/test/files...")
     */
    url(file: string) {
      let pathname = path.abs(file);

      if (isWindows()) {
        pathname = convertPathToPosix(pathname);
      }

      return new URL(`file://${pathname}`).toString();
    },

    /**
     * Returns the absolute path of the current working directory.
     */
    cwd() {
      return convertPathToPosix(nodePath.join(process.cwd(), nodePath.sep));
    },
  };

  return path;
}

/**
 * Helper functions for getting URLs in various formats
 */
function urlPathHelpers() {
  if (!isDom) {
    return;
  }

  // Get the URL of the "test" directory
  const testsDir = window.location.href;

  /**
   * URI-encodes the given file name
   */
  function encodePath(file: any) {
    return encodeURIComponent(file).split("%2F").join("/");
  }

  const path = {
    /**
     * Returns the relative path of a file in the "test" directory
     *
     * NOTE: When running in Karma the absolute path is returned instead
     */
    rel(file: any) {
      // Encode special characters in paths
      file = encodePath(file);

      if (window.location.href.indexOf(testsDir) === 0) {
        // We're running from the "/test/index.html" page, directly in a browser.
        // So return the relative path from the "test" directory.
        return file;
      } else {
        // We're running in Karma, so return an absolute path,
        // since we don't know the relative path of the "test" directory.
        return testsDir.replace(/^https?:\/\/[^/]+(\/.*)/, "$1" + file);
      }
    },

    /**
     * Returns the absolute path of a file in the "test" directory
     */
    abs(file: any) {
      return testsDir + encodePath(file);
    },

    /**
     * Does nothing. Needed to comply with Filesystem path helpers.
     */
    unixify(file: any) {
      return file;
    },
    /**
     * Returns the path of a file in the "test" directory as an absolute URL.
     * (e.g. "http://localhost/test/files/...")
     */
    url(file: any) {
      return path.abs(file);
    },

    /**
     * Returns the path of the current page.
     */
    cwd() {
      return location.href;
    },
  };

  return path;
}

export default {
  rel() {
    // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
    return !isDom ? pathHelpers.filesystem.rel(...arguments) : pathHelpers.url.rel(...arguments);
  },

  abs() {
    // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
    return !isDom ? pathHelpers.filesystem.abs(...arguments) : pathHelpers.url.abs(...arguments);
  },

  unixify() {
    // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
    return !isDom ? pathHelpers.filesystem.unixify(...arguments) : pathHelpers.url.unixify(...arguments);
  },

  url() {
    // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
    return !isDom ? pathHelpers.filesystem.url(...arguments) : pathHelpers.url.url(...arguments);
  },

  cwd() {
    // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
    return !isDom ? pathHelpers.filesystem.cwd(...arguments) : pathHelpers.url.cwd(...arguments);
  },
};
