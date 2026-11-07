import { describe, expect, it } from "vitest";
import $RefParser from "../../../lib/index.js";

const rootUrl = "mem://api/openapi.yaml";
const petUrl = "mem://api/schemas/pet.yaml";

function resolverFor(documents: Record<string, string>) {
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
        return document;
      },
    },
  };
}

describe("bundling references from an external file back to the root (issue #434)", () => {
  for (const openapi of ["3.0.3", "3.1.0"]) {
    for (const optimizeInternalRefs of [undefined, false]) {
      it(`internalizes the root reference in OpenAPI ${openapi} with optimization ${optimizeInternalRefs === false ? "disabled" : "enabled"}`, async () => {
        const documents = {
          [rootUrl]: `
openapi: ${openapi}
components:
  schemas:
    Pet:
      $ref: ./schemas/pet.yaml
    Error:
      type: object
      properties:
        message:
          type: string
`,
          [petUrl]: `
type: object
properties:
  lastError:
    $ref: ../openapi.yaml#/components/schemas/Error
`,
        };

        const bundled = await $RefParser.bundle(rootUrl, {
          resolve: resolverFor(documents),
          ...(optimizeInternalRefs === false ? { bundle: { optimizeInternalRefs } } : {}),
        });

        expect(bundled.components.schemas.Pet.properties.lastError).toEqual({
          $ref: "#/components/schemas/Error",
        });

        // The bundled document must work at a different location without the
        // original source files, including when ref optimization is disabled.
        const dereferenced = await $RefParser.dereference("mem://relocated/bundled.yaml", structuredClone(bundled), {
          resolve: resolverFor({}),
        });
        expect(dereferenced.components.schemas.Pet.properties.lastError).toBe(dereferenced.components.schemas.Error);
      });
    }
  }

  it("preserves the referenced root alias when optimization is disabled", async () => {
    const documents = {
      [rootUrl]: `
openapi: 3.1.0
components:
  schemas:
    Pet:
      $ref: ./schemas/pet.yaml
    Error:
      $ref: '#/components/schemas/ErrorDetails'
    ErrorDetails:
      type: string
`,
      [petUrl]: `
type: object
properties:
  lastError:
    $ref: ../openapi.yaml#/components/schemas/Error
`,
    };

    const bundled = await $RefParser.bundle(rootUrl, {
      resolve: resolverFor(documents),
      bundle: { optimizeInternalRefs: false },
    });

    expect(bundled.components.schemas.Pet.properties.lastError.$ref).toBe("#/components/schemas/Error");
    expect(bundled.components.schemas.Error.$ref).toBe("#/components/schemas/ErrorDetails");
    const dereferenced = await $RefParser.dereference("mem://relocated/bundled.yaml", structuredClone(bundled), {
      resolve: resolverFor({}),
    });
    expect(dereferenced.components.schemas.Pet.properties.lastError).toBe(dereferenced.components.schemas.ErrorDetails);
  });

  for (const optimizeInternalRefs of [undefined, false]) {
    it(`preserves nested resource targets reached through a root alias with optimization ${optimizeInternalRefs === false ? "disabled" : "enabled"}`, async () => {
      const schema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "mem://root",
        $defs: {
          nested: {
            $id: "mem://nested",
            $defs: { value: { type: "integer" } },
          },
          alias: { $ref: "mem://nested#/$defs/value" },
        },
        use: { $ref: "#/$defs/alias" },
      };

      const bundled = await $RefParser.bundle(schema, {
        ...(optimizeInternalRefs === false ? { bundle: { optimizeInternalRefs } } : {}),
      });

      expect(bundled.use.$ref).toBe(optimizeInternalRefs === false ? "#/$defs/alias" : "mem://nested#/$defs/value");
      const dereferenced = await $RefParser.dereference(structuredClone(bundled), {
        resolve: resolverFor({}),
      });
      expect(dereferenced.use).toEqual({ type: "integer" });
    });

    it(`preserves a nested resource's scope with optimization ${optimizeInternalRefs === false ? "disabled" : "enabled"}`, async () => {
      const documents = {
        [rootUrl]: `
$schema: https://json-schema.org/draft/2020-12/schema
$id: ${rootUrl}
components:
  schemas:
    Pet:
      $ref: ./schemas/pet.yaml
    Error:
      type: string
`,
        [petUrl]: `
$schema: https://json-schema.org/draft/2020-12/schema
$id: ${petUrl}
type: object
properties:
  lastError:
    $ref: ../openapi.yaml#/components/schemas/Error
  ownError:
    $ref: '#/$defs/Error'
$defs:
  Error:
    type: integer
`,
      };

      const bundled = await $RefParser.bundle(rootUrl, {
        resolve: resolverFor(documents),
        ...(optimizeInternalRefs === false ? { bundle: { optimizeInternalRefs } } : {}),
      });

      expect(bundled.components.schemas.Pet.$id).toBe(petUrl);
      const rootReference = bundled.components.schemas.Pet.properties.lastError.$ref;
      expect(new URL(rootReference, petUrl).href).toBe(`${rootUrl}#/components/schemas/Error`);
      expect(bundled.components.schemas.Pet.properties.ownError.$ref).toBe("#/$defs/Error");

      const dereferenced = await $RefParser.dereference("mem://relocated/bundled.yaml", structuredClone(bundled), {
        resolve: resolverFor({}),
      });
      expect(dereferenced.components.schemas.Pet.properties.lastError).toBe(dereferenced.components.schemas.Error);
      expect(dereferenced.components.schemas.Pet.properties.ownError).toEqual({ type: "integer" });
    });
  }
});
