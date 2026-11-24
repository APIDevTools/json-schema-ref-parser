import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

const rootUrl = "mem://schemas/root.json";

function resolverFor(documents: Record<string, unknown>) {
  return {
    file: false as const,
    http: false as const,
    mem: {
      canRead: /^mem:/,
      read(file: { url: string }) {
        const document = documents[file.url];
        if (document === undefined) {
          throw new Error(`Unexpected memory URL: ${file.url}`);
        }
        return JSON.stringify(document);
      },
    },
  };
}

async function bundleAndDereference(documents: Record<string, unknown>) {
  const resolve = resolverFor(documents);
  const bundled: any = await new $RefParser().bundle(rootUrl, { resolve });
  const fromBundle: any = await new $RefParser().dereference(
    "mem://relocated/bundle.json",
    JSON.parse(JSON.stringify(bundled)),
    { resolve: resolverFor({}) },
  );
  const fromFiles: any = await new $RefParser().dereference(rootUrl, { resolve });
  return { bundled, fromBundle, fromFiles };
}

describe("bundling extended $refs to the same target (issue #440)", () => {
  it("does not point an extended $ref at another extended $ref", async () => {
    const { bundled, fromBundle, fromFiles } = await bundleAndDereference({
      "mem://schemas/status.json": { type: "string" },
      "mem://schemas/a.json": {
        type: "object",
        properties: { status: { $ref: "status.json", description: "A status" } },
      },
      "mem://schemas/b.json": {
        type: "object",
        properties: { status: { $ref: "status.json", nullable: true } },
      },
      [rootUrl]: {
        $defs: {
          A: { $ref: "a.json" },
          B: { $ref: "b.json" },
        },
      },
    });

    expect(bundled.$defs.A.properties.status).toEqual({ type: "string", description: "A status" });
    expect(bundled.$defs.B.properties.status).toEqual({ type: "string", nullable: true });
    expect(fromBundle.$defs.B.properties.status).toEqual({ type: "string", nullable: true });
    expect(fromBundle).toEqual(fromFiles);
  });

  it("does not point a sub-path $ref beneath a key that an extended $ref overrides", async () => {
    const { bundled, fromBundle, fromFiles } = await bundleAndDereference({
      "mem://schemas/person.json": {
        type: "object",
        properties: { name: { type: "string" } },
      },
      [rootUrl]: {
        $defs: {
          A: { $ref: "person.json", properties: { name: { description: "A name" } } },
          B: { $ref: "person.json#/properties/name" },
        },
      },
    });

    expect(bundled.$defs.B).toEqual({ type: "string" });
    expect(fromBundle.$defs.B).toEqual({ type: "string" });
    expect(fromBundle).toEqual(fromFiles);
  });

  it("still remaps a sub-path $ref beneath keys that an extended $ref leaves alone", async () => {
    const { bundled, fromBundle, fromFiles } = await bundleAndDereference({
      "mem://schemas/person.json": {
        type: "object",
        properties: { name: { type: "string" } },
      },
      [rootUrl]: {
        $defs: {
          A: { $ref: "person.json", description: "A person" },
          B: { $ref: "person.json#/properties/name" },
        },
      },
    });

    expect(bundled.$defs.B).toEqual({ $ref: "#/$defs/A/properties/name" });
    expect(fromBundle).toEqual(fromFiles);
  });

  for (const optimizeInternalRefs of [true, false]) {
    it(`keeps recursive sibling overrides at their own locations (optimizeInternalRefs: ${optimizeInternalRefs})`, async () => {
      const root = { $defs: { A: { $ref: "node.json", description: "outer" } } };
      const resolve = resolverFor({
        "mem://schemas/node.json": {
          type: "object",
          properties: { left: { $ref: "#", title: "left" }, right: { $ref: "#", title: "right" } },
        },
      });
      const bundled = await $RefParser.bundle(rootUrl, root, { resolve, bundle: { optimizeInternalRefs } });
      const restored: any = await $RefParser.dereference(
        "mem://elsewhere/round-trip.json",
        JSON.parse(JSON.stringify(bundled)),
        { resolve: resolverFor({}) },
      );
      const { A } = restored.$defs;
      expect(A.description).toBe("outer");
      expect(A.properties.left.title).toBe("left");
      expect(A.properties.right.title).toBe("right");
      expect(A.properties.left).not.toHaveProperty("description");
      expect(A.properties.right.properties.left).toBe(A.properties.left);
    });

    it(`preserves one canonical resource and its nested pointers (optimizeInternalRefs: ${optimizeInternalRefs})`, async () => {
      const nodeUrl = "mem://schemas/node.json";
      const resolve = resolverFor({
        [nodeUrl]: {
          $id: nodeUrl,
          properties: { first: { $ref: "leaf.json" }, second: { $ref: "leaf.json" } },
        },
        "mem://schemas/leaf.json": { type: "integer" },
      });
      const schema = {
        $id: rootUrl,
        $defs: {
          A: { $ref: "node.json", title: "first" },
          B: { $ref: "node.json", description: "second" },
          "node.json": { type: "boolean" },
        },
      };
      const bundled: any = await $RefParser.bundle(rootUrl, schema, { resolve, bundle: { optimizeInternalRefs } });
      const json = JSON.stringify(bundled);
      expect(json.split(nodeUrl)).toHaveLength(2);
      expect(bundled.$defs["node.json"]).toEqual({ type: "boolean" });
      const restored: any = await $RefParser.dereference("mem://elsewhere/round-trip.json", JSON.parse(json), {
        resolve: resolverFor({}),
      });
      expect(restored.$defs.A.title).toBe("first");
      expect(restored.$defs.B.description).toBe("second");
      expect(restored.$defs.B).not.toHaveProperty("title");
      expect(restored.$defs.A.properties.first).toEqual({ type: "integer" });
      expect(restored.$defs.B.properties.second).toEqual({ type: "integer" });
    });
  }

  it("preserves an identified resource within an overridden subpath", async () => {
    const id = "mem://schemas/nested.json";
    const schema = {
      $id: rootUrl,
      $defs: {
        A: { $ref: "node.json", properties: { nested: { description: "first" } } },
        B: { $ref: "node.json#/properties/nested" },
      },
    };
    const bundled = await $RefParser.bundle(rootUrl, schema, {
      resolve: resolverFor({
        "mem://schemas/node.json": { properties: { nested: { $id: id, type: "string" } } },
      }),
    });
    const json = JSON.stringify(bundled);
    expect(json.split(id)).toHaveLength(2);
    const restored: any = await $RefParser.dereference("mem://elsewhere/bundle.json", JSON.parse(json), {
      resolve: resolverFor({}),
    });
    expect(restored.$defs.A.properties.nested.description).toBe("first");
    expect(restored.$defs.B).toEqual({ $id: id, type: "string" });
  });

  for (const rootShape of ["array", "reference"]) {
    it(`resolves a shared resource's self-reference within a bare ${rootShape}`, async () => {
      const outer = { $ref: "node.json", description: "outer" };
      const schema = rootShape === "array" ? [outer, { $ref: "node.json", title: "second" }] : outer;
      const resolve = resolverFor({
        "mem://schemas/node.json": {
          $id: "mem://schemas/node.json",
          type: "object",
          properties: { child: { $ref: "#", title: "inner" } },
        },
      });
      const bundled = await $RefParser.bundle(rootUrl, schema, { resolve });
      const restored: any = await $RefParser.dereference(
        "mem://relocated/bundle.json",
        JSON.parse(JSON.stringify(bundled)),
        { resolve: resolverFor({}) },
      );
      const value = rootShape === "array" ? restored[0] : restored;
      expect(value.description).toBe("outer");
      expect(value.properties.child.title).toBe("inner");
      expect(value.properties.child.type).toBe("object");
      expect(value.properties.child).not.toHaveProperty("description");
    });
  }

  it("uses valid OpenAPI component names for shared resources", async () => {
    const nodeUrl = "mem://schemas/n%C3%B8de%20file.json";
    const root = {
      openapi: "3.1.0",
      components: {
        schemas: {
          A: { $ref: nodeUrl, title: "A" },
          B: { $ref: nodeUrl, title: "B" },
          "node.json": { type: "boolean" },
        },
      },
    };
    const resolve = resolverFor({ [nodeUrl]: { $id: nodeUrl, type: "string" } });
    const bundled: any = await $RefParser.bundle(rootUrl, root, { resolve });
    expect(bundled).not.toHaveProperty("$defs");
    expect(bundled.components.schemas["node.json"]).toEqual({ type: "boolean" });
    expect(Object.keys(bundled.components.schemas).every((key) => /^[a-zA-Z0-9._-]+$/.test(key))).toBe(true);
    const definitions = Object.values(bundled.components.schemas).filter((schema: any) => schema.$id === nodeUrl);
    expect(definitions).toEqual([{ $id: nodeUrl, type: "string" }]);
    const restored: any = await $RefParser.dereference(
      "mem://elsewhere/round-trip.json",
      JSON.parse(JSON.stringify(bundled)),
      { resolve: resolverFor({}) },
    );
    expect(restored.components.schemas.A).toEqual({ $id: nodeUrl, type: "string", title: "A" });
    expect(restored.components.schemas.B).toEqual({ $id: nodeUrl, type: "string", title: "B" });
  });
});
