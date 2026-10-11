import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";
import type { FileInfo, ParserOptions } from "../../../lib/index.js";

function memoryOptions(documents: Record<string, object>, reads: string[]): ParserOptions {
  return {
    resolve: {
      file: false,
      http: false,
      memory: {
        canRead: /^mem:/,
        read(file: FileInfo) {
          reads.push(file.url);
          const document = documents[file.url];
          if (!document) {
            throw new Error(`Unexpected memory URL: ${file.url}`);
          }
          return document;
        },
      },
    },
  };
}

describe("shared objects in distinct schema resources", () => {
  it("registers a relative identifier at every inherited URI scope", async () => {
    const shared = { $id: "child.json", type: "string" };
    const schema = {
      $id: "mem://root/schema.json",
      $defs: {
        first: { $id: "one/", $defs: { child: shared } },
        second: { $id: "two/", $defs: { child: shared } },
      },
    };

    const refs = await $RefParser.resolve("mem://source.json", schema, memoryOptions({}, []));

    expect(refs.get("mem://root/one/child.json")).toBe(shared);
    expect(refs.get("mem://root/two/child.json")).toBe(shared);
  });

  it("loads a shared relative reference in every inherited URI scope", async () => {
    const shared = { $ref: "value.json" };
    const reads: string[] = [];
    const schema = {
      $id: "mem://root/schema.json",
      $defs: {
        first: { $id: "one/", properties: { value: shared } },
        second: { $id: "two/", properties: { value: shared } },
      },
    };
    const options = memoryOptions(
      {
        "mem://root/one/value.json": { type: "string" },
        "mem://root/two/value.json": { type: "number" },
      },
      reads,
    );

    const refs = await $RefParser.resolve("mem://source.json", schema, options);

    expect(reads.sort()).toEqual(["mem://root/one/value.json", "mem://root/two/value.json"]);
    expect(refs.get("mem://root/two/value.json")).toEqual({ type: "number" });
  });

  it("inventories shared references in every URI scope of an external document", async () => {
    const shared = { $ref: "value.json" };
    const reads: string[] = [];
    const options = memoryOptions(
      {
        "mem://external.json": {
          $id: "mem://root/schema.json",
          selected: { type: "boolean" },
          $defs: {
            first: { $id: "one/", properties: { value: shared } },
            second: { $id: "two/", properties: { value: shared } },
          },
        },
        "mem://root/one/value.json": { type: "string" },
        "mem://root/two/value.json": { type: "number" },
      },
      reads,
    );
    options.resolveExcludedPathMatcher = () => false;

    await $RefParser.resolve("mem://source.json", { $ref: "mem://external.json#/selected" }, options);

    expect(reads.sort()).toEqual(["mem://external.json", "mem://root/one/value.json", "mem://root/two/value.json"]);
  });

  it.each([false, true])("terminates object cycles with relative identifiers (matcher: %s)", async (useMatcher) => {
    const shared: Record<string, unknown> = { $id: "child/", properties: { value: { $ref: "value.json" } } };
    shared.self = shared;
    const reads: string[] = [];
    const options = memoryOptions(
      {
        "mem://external.json": {
          $id: "mem://root/schema.json",
          selected: { type: "boolean" },
          $defs: {
            first: { $id: "one/", $defs: { child: shared } },
            second: { $id: "two/", $defs: { child: shared } },
          },
        },
        "mem://root/one/child/value.json": { type: "string" },
        "mem://root/two/child/value.json": { type: "number" },
      },
      reads,
    );
    if (useMatcher) {
      options.resolveExcludedPathMatcher = () => false;
    }

    const refs = await $RefParser.resolve("mem://source.json", { $ref: "mem://external.json#/selected" }, options);

    expect(refs.get("mem://root/one/child/")).toBe(shared);
    expect(refs.get("mem://root/two/child/")).toBe(shared);
    expect(reads.sort()).toEqual([
      "mem://external.json",
      "mem://root/one/child/value.json",
      "mem://root/two/child/value.json",
    ]);
  });
});
