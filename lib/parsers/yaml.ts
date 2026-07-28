import { ParserError } from "../util/errors.js";
import { binaryTag, CORE_SCHEMA, load, loadAll, mergeTag, omapTag, pairsTag, setTag, timestampTag } from "js-yaml";
import type { FileInfo } from "../types/index.js";
import type { Plugin } from "../types/index.js";

// Match js-yaml v4's default schema for the fallback parser. In v4, JSON_SCHEMA
// and CORE_SCHEMA behaved identically; v5's CORE_SCHEMA preserves that behavior,
// including null values for omitted mapping values and strings for date-like data.
const legacyDefaultSchema = CORE_SCHEMA.withTags(timestampTag, mergeTag, binaryTag, omapTag, pairsTag, setTag);

export default {
  /**
   * The order that this parser will run, in relation to other parsers.
   */
  order: 200,

  /**
   * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
   */
  allowEmpty: true,

  /**
   * Determines whether this parser can parse a given file reference.
   * Parsers that match will be tried, in order, until one successfully parses the file.
   * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
   * every parser will be tried.
   */
  canParse: [".yaml", ".yml", ".json"], // JSON is valid YAML

  /**
   * Parses the given file as YAML
   *
   * @param file           - An object containing information about the referenced file
   * @param file.url       - The full URL of the referenced file
   * @param file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
   * @param file.data      - The file contents. This will be whatever data type was returned by the resolver
   * @returns
   */
  async parse(file: FileInfo) {
    let data = file.data;
    if (Buffer.isBuffer(data)) {
      data = data.toString();
    }

    if (typeof data === "string") {
      try {
        return load(data, { schema: CORE_SCHEMA });
      } catch {
        try {
          // Fall back to js-yaml v4's extended default schema.
          return load(data, { schema: legacyDefaultSchema });
        } catch (e: any) {
          // js-yaml v5 throws for empty streams, whereas v4 returned undefined.
          // Preserve the parser's allowEmpty behavior for blank/comment-only files.
          try {
            if (loadAll(data, { schema: CORE_SCHEMA }).length === 0) {
              return undefined;
            }
          } catch {
            // Preserve the more useful fallback parser error below.
          }
          throw new ParserError(e?.message || "Parser Error", file.url);
        }
      }
    } else {
      // data is already a JavaScript value (object, array, number, null, NaN, etc.)
      return data;
    }
  },
} as Plugin;
