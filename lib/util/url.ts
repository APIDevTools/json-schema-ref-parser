const isWindows = /^win/.test(globalThis.process ? globalThis.process.platform : ""),
  forwardSlashPattern = /\//g,
  protocolPattern = /^(\w{2,}):\/\//i,
  jsonPointerSlash = /~1/g,
  jsonPointerTilde = /~0/g;
import { join } from "path";

const projectDir = join(__dirname, "..", "..");
// RegExp patterns to URL-encode special characters in local filesystem paths
const urlEncodePatterns = [/\?/g, "%3F", /#/g, "%23"];

// RegExp patterns to URL-decode special characters for local filesystem paths
const urlDecodePatterns = [/%23/g, "#", /%24/g, "$", /%26/g, "&", /%2C/g, ",", /%40/g, "@"];

export const parse = (u: any) => new URL(u);

/**
 * Returns resolved target URL relative to a base URL in a manner similar to that of a Web browser resolving an anchor tag HREF.
 *
 * @returns
 */
export function resolve(from: any, to: any) {
  const resolvedUrl = new URL(to, new URL(from, "resolve://"));
  if (resolvedUrl.protocol === "resolve:") {
    // `from` is a relative URL.
    const { pathname, search, hash } = resolvedUrl;
    return pathname + search + hash;
  }
  return resolvedUrl.toString();
}

/**
 * Returns the current working directory (in Node) or the current page URL (in browsers).
 *
 * @returns
 */
export function cwd() {
  if (typeof window !== "undefined") {
    return location.href;
  }

  const path = process.cwd();

  const lastChar = path.slice(-1);
  if (lastChar === "/" || lastChar === "\\") {
    return path;
  } else {
    return path + "/";
  }
}

/**
 * Returns the protocol of the given URL, or `undefined` if it has no protocol.
 *
 * @param path
 * @returns
 */
export function getProtocol(path: any) {
  const match = protocolPattern.exec(path);
  if (match) {
    return match[1].toLowerCase();
  }
}

/**
 * Returns the lowercased file extension of the given URL,
 * or an empty string if it has no extension.
 *
 * @param path
 * @returns
 */
export function getExtension(path: any) {
  const lastDot = path.lastIndexOf(".");
  if (lastDot >= 0) {
    return stripQuery(path.substr(lastDot).toLowerCase());
  }
  return "";
}

/**
 * Removes the query, if any, from the given path.
 *
 * @param path
 * @returns
 */
export function stripQuery(path: any) {
  const queryIndex = path.indexOf("?");
  if (queryIndex >= 0) {
    path = path.substr(0, queryIndex);
  }
  return path;
}

/**
 * Returns the hash (URL fragment), of the given path.
 * If there is no hash, then the root hash ("#") is returned.
 *
 * @param path
 * @returns
 */
export function getHash(path: any) {
  const hashIndex = path.indexOf("#");
  if (hashIndex >= 0) {
    return path.substr(hashIndex);
  }
  return "#";
}

/**
 * Removes the hash (URL fragment), if any, from the given path.
 *
 * @param path
 * @returns
 */
export function stripHash(path: any) {
  const hashIndex = path.indexOf("#");
  if (hashIndex >= 0) {
    path = path.substr(0, hashIndex);
  }
  return path;
}

/**
 * Determines whether the given path is an HTTP(S) URL.
 *
 * @param path
 * @returns
 */
export function isHttp(path: any) {
  const protocol = getProtocol(path);
  if (protocol === "http" || protocol === "https") {
    return true;
  } else if (protocol === undefined) {
    // There is no protocol.  If we're running in a browser, then assume it's HTTP.
    return typeof window !== "undefined";
  } else {
    // It's some other protocol, such as "ftp://", "mongodb://", etc.
    return false;
  }
}

/**
 * Determines whether the given path is a filesystem path.
 * This includes "file://" URLs.
 *
 * @param path
 * @returns
 */
export function isFileSystemPath(path: any) {
  // @ts-ignore
  if (typeof window !== "undefined" || process.browser) {
    // We're running in a browser, so assume that all paths are URLs.
    // This way, even relative paths will be treated as URLs rather than as filesystem paths
    return false;
  }

  const protocol = getProtocol(path);
  return protocol === undefined || protocol === "file";
}

/**
 * Converts a filesystem path to a properly-encoded URL.
 *
 * This is intended to handle situations where JSON Schema $Ref Parser is called
 * with a filesystem path that contains characters which are not allowed in URLs.
 *
 * @example
 * The following filesystem paths would be converted to the following URLs:
 *
 *    <"!@#$%^&*+=?'>.json              ==>   %3C%22!@%23$%25%5E&*+=%3F\'%3E.json
 *    C:\\My Documents\\File (1).json   ==>   C:/My%20Documents/File%20(1).json
 *    file://Project #42/file.json      ==>   file://Project%20%2342/file.json
 *
 * @param path
 * @returns
 */
export function fromFileSystemPath(path: any) {
  // Step 1: On Windows, replace backslashes with forward slashes,
  // rather than encoding them as "%5C"
  if (isWindows) {
    const hasProjectDir = path.toUpperCase().includes(projectDir.replace(/\\/g, "\\").toUpperCase());
    const hasProjectUri = path.toUpperCase().includes(projectDir.replace(/\\/g, "/").toUpperCase());
    if (hasProjectDir || hasProjectUri) {
      path = path.replace(/\\/g, "/");
    } else {
      path = `${projectDir}/${path}`.replace(/\\/g, "/");
    }
  }

  // Step 2: `encodeURI` will take care of MOST characters
  path = encodeURI(path);

  // Step 3: Manually encode characters that are not encoded by `encodeURI`.
  // This includes characters such as "#" and "?", which have special meaning in URLs,
  // but are just normal characters in a filesystem path.
  for (let i = 0; i < urlEncodePatterns.length; i += 2) {
    path = path.replace(urlEncodePatterns[i], urlEncodePatterns[i + 1]);
  }

  return path;
}

/**
 * Converts a URL to a local filesystem path.
 */
export function toFileSystemPath(path: string | undefined, keepFileProtocol?: boolean): string {
  // Step 1: `decodeURI` will decode characters such as Cyrillic characters, spaces, etc.
  path = decodeURI(path!);

  // Step 2: Manually decode characters that are not decoded by `decodeURI`.
  // This includes characters such as "#" and "?", which have special meaning in URLs,
  // but are just normal characters in a filesystem path.
  for (let i = 0; i < urlDecodePatterns.length; i += 2) {
    path = path.replace(urlDecodePatterns[i], urlDecodePatterns[i + 1] as string);
  }

  // Step 3: If it's a "file://" URL, then format it consistently
  // or convert it to a local filesystem path
  let isFileUrl = path.substr(0, 7).toLowerCase() === "file://";
  if (isFileUrl) {
    // Strip-off the protocol, and the initial "/", if there is one
    path = path[7] === "/" ? path.substr(8) : path.substr(7);

    // insert a colon (":") after the drive letter on Windows
    if (isWindows && path[1] === "/") {
      path = path[0] + ":" + path.substr(1);
    }

    if (keepFileProtocol) {
      // Return the consistently-formatted "file://" URL
      path = "file:///" + path;
    } else {
      // Convert the "file://" URL to a local filesystem path.
      // On Windows, it will start with something like "C:/".
      // On Posix, it will start with "/"
      isFileUrl = false;
      path = isWindows ? path : "/" + path;
    }
  }

  // Step 4: Normalize Windows paths (unless it's a "file://" URL)
  if (isWindows && !isFileUrl) {
    // Replace forward slashes with backslashes
    path = path.replace(forwardSlashPattern, "\\");

    // Capitalize the drive letter
    if (path.substr(1, 2) === ":\\") {
      path = path[0].toUpperCase() + path.substr(1);
    }
  }

  return path;
}

/**
 * Converts a $ref pointer to a valid JSON Path.
 *
 * @param pointer
 * @returns
 */
export function safePointerToPath(pointer: any) {
  if (pointer.length <= 1 || pointer[0] !== "#" || pointer[1] !== "/") {
    return [];
  }

  return pointer
    .slice(2)
    .split("/")
    .map((value: any) => {
      return decodeURIComponent(value).replace(jsonPointerSlash, "/").replace(jsonPointerTilde, "~");
    });
}
