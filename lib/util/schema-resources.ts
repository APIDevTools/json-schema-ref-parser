import * as url from "./url.js";
import type { ParserOptions } from "../options.js";
import type { JSONSchema } from "../index.js";
import type $Refs from "../refs.js";

export function getSchemaBasePath(basePath: string, value: unknown, legacyId = false) {
  const schemaId = getSchemaId(value, legacyId);
  return schemaId ? url.resolve(basePath, schemaId) : basePath;
}

export function usesDynamicIdScope(value: unknown) {
  if (!value || typeof value !== "object" || ArrayBuffer.isView(value)) {
    return false;
  }

  // A schema can omit `$schema`, but an explicit identifier still establishes
  // a base URI for references inside that resource.
  if (getSchemaId(value)) {
    return true;
  }

  const schema = (value as { $schema?: unknown }).$schema;
  if (
    typeof schema === "string" &&
    (schema.includes("draft-04/") ||
      schema.includes("draft-06/") ||
      schema.includes("draft-07/") ||
      schema.includes("draft/2019-09/") ||
      schema.includes("draft/2020-12/") ||
      schema.includes("oas/3.1/"))
  ) {
    return true;
  }

  const openapi = (value as { openapi?: unknown }).openapi;
  return typeof openapi === "string" && /^3\.1(?:\.|$)/.test(openapi);
}

export function registerSchemaResources<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  $refs: $Refs<S, O>,
  basePath: string,
  value: unknown,
  pathType?: string | unknown,
  dynamicIdScope = false,
) {
  if (!dynamicIdScope) {
    return;
  }

  const seen = new Set<object>();

  const visit = (node: unknown, scopeBase: string, inheritedLegacyId: boolean) => {
    if (!node || typeof node !== "object" || ArrayBuffer.isView(node) || seen.has(node)) {
      return;
    }

    seen.add(node);

    const legacyId = getSchemaIdMode(node, inheritedLegacyId);
    const nextScopeBase = getSchemaBasePath(scopeBase, node, legacyId);
    if (nextScopeBase !== scopeBase) {
      $refs._addAlias(nextScopeBase, node as S, pathType, dynamicIdScope, legacyId);
    }

    for (const key of Object.keys(node)) {
      visit((node as Record<string, unknown>)[key], nextScopeBase, legacyId);
    }
  };

  visit(value, basePath, false);
}

export function getSchemaId(value: unknown, inheritedLegacyId = false): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const legacyId = getSchemaIdMode(value, inheritedLegacyId);
  const schemaId = legacyId ? (value as { id?: unknown }).id : (value as { $id?: unknown }).$id;
  if (typeof schemaId === "string" && schemaId.length > 0) {
    return schemaId;
  }

  return undefined;
}

export function getSchemaIdMode(value: unknown, inheritedLegacyId = false): boolean {
  if (!value || typeof value !== "object") {
    return inheritedLegacyId;
  }

  const schema = (value as { $schema?: unknown }).$schema;
  if (typeof schema === "string") {
    if (schema.includes("draft-04/")) {
      return true;
    }
    if (
      schema.includes("draft-06/") ||
      schema.includes("draft-07/") ||
      schema.includes("draft/2019-09/") ||
      schema.includes("draft/2020-12/") ||
      schema.includes("oas/3.1/")
    ) {
      return false;
    }
  }

  const openapi = (value as { openapi?: unknown }).openapi;
  if (typeof openapi === "string" && /^3\.1(?:\.|$)/.test(openapi)) {
    return false;
  }

  return inheritedLegacyId;
}
