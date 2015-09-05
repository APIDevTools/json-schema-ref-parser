/**!
 * JSON Schema $Ref Parser v1.0.0-alpha.13
 *
 * @link https://github.com/BigstickCarpet/json-schema-ref-parser
 * @license MIT
 */
'use strict';

module.exports = bundle;

/**
 * Bundles all external JSON references into the main JSON schema, thus resulting in a schema that
 * only has *internal* references, not any *external* references.
 * This method mutates the JSON schema object, adding new references and remapping existing ones.
 *
 * @param {$RefParser} parser
 * @param {$RefParserOptions} options
 */
function bundle(parser, options) {
  throw new Error('The "bundle" method is not implemented yet.  It will be implemented before the final alpha.');
}
