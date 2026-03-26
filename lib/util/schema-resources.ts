import * as url from "./url.js";
import type { ParserOptions } from "../options.js";
import type { JSONSchema } from "../index.js";
import type $Refs from "../refs.js";

export function getSchemaBasePath(basePath: string, value: unknown) {
  const schemaId = getSchemaId(value);
  return schemaId ? url.resolve(basePath, schemaId) : basePath;
}

export function usesDynamicIdScope(value: unknown) {
  if (!value || typeof value !== "object" || ArrayBuffer.isView(value)) {
    return false;
  }

  const schema = (value as { $schema?: unknown }).$schema;
  if (
    typeof schema === "string" &&
    (schema.includes("draft/2019-09/") || schema.includes("draft/2020-12/") || schema.includes("oas/3.1/"))
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

  const visit = (node: unknown, scopeBase: string, pointerTokens: string[]) => {
    if (!node || typeof node !== "object" || ArrayBuffer.isView(node) || seen.has(node)) {
      return;
    }

    seen.add(node);

    const nextScopeBase = getSchemaBasePath(scopeBase, node);
    const resourcePointerTokens = nextScopeBase === scopeBase ? pointerTokens : [];
    if (nextScopeBase !== scopeBase) {
      $refs._addAlias(nextScopeBase, node as S, pathType, dynamicIdScope);
    }
    registerAnchorAliases($refs, nextScopeBase, resourcePointerTokens, node);

    for (const key of Object.keys(node)) {
      visit((node as Record<string, unknown>)[key], nextScopeBase, [...resourcePointerTokens, key]);
    }
  };

  visit(value, basePath, []);
}

function getSchemaId(value: unknown): string | undefined {
  if (
    value &&
    typeof value === "object" &&
    "$id" in value &&
    typeof (value as { $id?: unknown }).$id === "string" &&
    (value as { $id: string }).$id.length > 0
  ) {
    return (value as { $id: string }).$id;
  }

  return undefined;
}

function registerAnchorAliases<S extends object = JSONSchema, O extends ParserOptions<S> = ParserOptions<S>>(
  $refs: $Refs<S, O>,
  scopeBase: string,
  pointerTokens: string[],
  value: unknown,
) {
  if (!value || typeof value !== "object" || ArrayBuffer.isView(value)) {
    return;
  }

  const resourceBase = url.stripHash(scopeBase);
  const targetPath = pointerTokens.length > 0 ? joinPointerPath(resourceBase, pointerTokens) : `${resourceBase}#`;
  const anchors = [
    (value as { $anchor?: unknown }).$anchor,
    (value as { $dynamicAnchor?: unknown }).$dynamicAnchor,
  ];

  for (const anchor of anchors) {
    if (typeof anchor === "string" && anchor.length > 0) {
      $refs._addExactAlias(`${resourceBase}#${anchor}`, targetPath);
    }
  }
}

function joinPointerPath(basePath: string, tokens: string[]) {
  let path = `${basePath}#`;

  for (const token of tokens) {
    path += `/${token.replace(/~/g, "~0").replace(/\//g, "~1")}`;
  }

  return path;
}
