import { describe, expect, it, vi } from "vitest";
import $RefParser, { jsonSchemaParserNormalizeArgs } from "../../lib/index.js";

const operations = ["parse", "resolve", "bundle", "dereference"] as const;

describe("mutateInputSchema: false", () => {
  it.each(operations)("%s preserves shared objects and cycles in the input copy", async (operation) => {
    const shared = { type: "string" };
    const original: {
      properties: { first: typeof shared; second: typeof shared };
      self?: object;
    } = { properties: { first: shared, second: shared } };
    original.self = original;

    const parser = new $RefParser<typeof original>();
    await parser[operation](original, { mutateInputSchema: false });
    const result = parser.schema as typeof original;

    expect(result).not.toBe(original);
    expect(result.self).toBe(result);
    expect(result.properties.first).toBe(result.properties.second);
    expect(result.properties.first).not.toBe(shared);
    result.properties.first.type = "number";
    expect(shared.type).toBe("string");
    expect(original.self).toBe(original);
  });

  it.each(operations)("%s copies the input only once", async (operation) => {
    const original = { type: "object", properties: { name: { type: "string" } } };
    const clone = vi.spyOn(globalThis, "structuredClone");
    try {
      const parser = new $RefParser<typeof original>();
      await parser[operation](original, { mutateInputSchema: false });

      expect(clone).toHaveBeenCalledExactlyOnceWith(original);
      expect(parser.schema).toEqual(original);
      expect(parser.schema).not.toBe(original);
    } finally {
      clone.mockRestore();
    }
  });

  it("dereferences references within the copy without modifying the input", async () => {
    const original = {
      definitions: { Name: { type: "string" } },
      properties: { name: { $ref: "#/definitions/Name" } },
    };
    const result = await $RefParser.dereference(original, { mutateInputSchema: false });

    expect(result.properties.name).toBe(result.definitions.Name);
    expect(result.definitions.Name).not.toBe(original.definitions.Name);
    expect(original.properties.name).toEqual({ $ref: "#/definitions/Name" });
  });

  it("bundles external references within the copy without modifying the input", async () => {
    const original = { properties: { name: { $ref: "name.json" } } };
    const result = await $RefParser.bundle("https://example.com/root.json", original, {
      mutateInputSchema: false,
      resolve: {
        http: {
          read: () => JSON.stringify({ type: "string" }),
        },
      },
    });

    expect(result.properties.name).toEqual({ type: "string" });
    expect(original.properties.name).toEqual({ $ref: "name.json" });
  });

  it("still copies input when the exported argument normalizer is called directly", () => {
    const original = { properties: { name: { type: "string" } } };
    const args = jsonSchemaParserNormalizeArgs([original, { mutateInputSchema: false }]);

    expect(args.schema).toEqual(original);
    expect(args.schema).not.toBe(original);
    expect((args.schema as typeof original).properties).not.toBe(original.properties);
  });
});

describe("option normalization errors", () => {
  it.each(operations)("%s delivers schema initialization errors to its callback exactly once", async (operation) => {
    const error = new Error("Cannot read schema identifier");
    const schema = {
      get $id() {
        throw error;
      },
    };
    const callback = vi.fn<(error: unknown) => void>();
    const received = new Promise<unknown>((resolve) => callback.mockImplementation(resolve));

    await expect(new $RefParser()[operation](schema, callback)).resolves.toBeUndefined();

    expect(await received).toBe(error);
    expect(callback).toHaveBeenCalledExactlyOnceWith(error);
  });

  it.each(operations)("%s rejects with the original option error", async (operation) => {
    const error = new Error("Cannot read bundle options");
    const options = {
      get bundle() {
        throw error;
      },
    };

    await expect(new $RefParser()[operation]({}, options)).rejects.toBe(error);
  });

  it.each(operations)("%s delivers option errors to its callback exactly once", async (operation) => {
    const error = new Error("Cannot read bundle options");
    const options = {
      get bundle() {
        throw error;
      },
    };
    const callback = vi.fn<(error: unknown) => void>();
    const received = new Promise<unknown>((resolve) => callback.mockImplementation(resolve));

    await new $RefParser()[operation]({}, options, callback);

    expect(await received).toBe(error);
    expect(callback).toHaveBeenCalledExactlyOnceWith(error);
  });

  it.each(operations)("%s delivers the original clone error to its callback exactly once", async (operation) => {
    const original = { unsupported: () => true };
    const clone = vi.spyOn(globalThis, "structuredClone");
    const callback = vi.fn<(error: unknown) => void>();
    const received = new Promise<unknown>((resolve) => callback.mockImplementation(resolve));
    try {
      await new $RefParser()[operation](original, { mutateInputSchema: false }, callback);

      const error = await received;
      expect(error).toHaveProperty("name", "DataCloneError");
      expect(clone).toHaveBeenCalledExactlyOnceWith(original);
      expect(clone.mock.results[0].type).toBe("throw");
      expect(clone.mock.results[0].value).toBe(error);
      expect(callback).toHaveBeenCalledExactlyOnceWith(error);
    } finally {
      clone.mockRestore();
    }
  });

  it("propagates the original error without logging or using partially normalized options", () => {
    const error = new Error("Cannot read bundle options");
    const options = {
      get bundle() {
        throw error;
      },
    };
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => jsonSchemaParserNormalizeArgs([{}, options])).toThrow(error);
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
