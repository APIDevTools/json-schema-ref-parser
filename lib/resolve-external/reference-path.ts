import type $Refs from "../refs.js";
import type { ParserOptions } from "../options.js";
import * as url from "../util/url.js";
import { ResolverError } from "../util/errors.js";

/** Resolve a reference in its URI scope, checking access from its physical document before any load or cache hit. */
export function resolveReferencePath<S extends object, O extends ParserOptions<S>>(
  base: string,
  reference: string,
  sourcePath: string,
  $refs: $Refs<S, O>,
  options: O,
): string | undefined {
  const target = url.resolve(base, reference);
  const sourceDocument = url.stripHash(sourcePath);
  if (reference.startsWith("#") || !url.isHttp(sourceDocument) || !url.isFileSystemPath(target)) {
    return target;
  }

  const targetDocument = url.stripHash(target);
  const alias = $refs._aliases[targetDocument];
  // A file-shaped canonical ID can name a resource embedded in a remote document.
  if (!$refs._$refs[targetDocument] && alias?.sourcePath && !url.isFileSystemPath(alias.sourcePath)) {
    return target;
  }

  const error = new ResolverError(
    new Error(`Cannot resolve local file "${targetDocument}" from remote schema "${sourceDocument}"`),
    sourceDocument,
  );
  error.path = url.safePointerToPath(url.getHash(sourcePath));
  if (!options.continueOnError) {
    throw error;
  }
  $refs._$refs[sourceDocument].addError(error);
  return undefined;
}
