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
  const fromBundle: any = await new $RefParser().dereference(structuredClone(bundled));
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
});
