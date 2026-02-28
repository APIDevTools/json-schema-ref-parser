import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("Complex schema composition patterns", () => {
  describe("diamond dependency pattern", () => {
    const schema = {
      type: "object",
      properties: {
        entity: { $ref: "#/definitions/FullEntity" },
      },
      definitions: {
        Base: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Named: {
          allOf: [
            { $ref: "#/definitions/Base" },
            {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
          ],
        },
        Timestamped: {
          allOf: [
            { $ref: "#/definitions/Base" },
            {
              type: "object",
              properties: {
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        FullEntity: {
          allOf: [
            { $ref: "#/definitions/Named" },
            { $ref: "#/definitions/Timestamped" },
            {
              type: "object",
              properties: {
                data: { type: "object" },
              },
            },
          ],
        },
      },
    };

    it("should dereference diamond inheritance pattern", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      // Both Named and Timestamped extend Base, and FullEntity extends both
      const base = (result as any).definitions.Base;
      const named = (result as any).definitions.Named;
      const timestamped = (result as any).definitions.Timestamped;

      // Named and Timestamped should both reference the same Base
      expect(named.allOf[0]).to.equal(base);
      expect(timestamped.allOf[0]).to.equal(base);

      // FullEntity's allOf should reference Named and Timestamped
      const fullEntity = (result as any).definitions.FullEntity;
      expect(fullEntity.allOf[0]).to.equal(named);
      expect(fullEntity.allOf[1]).to.equal(timestamped);

      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("multi-level allOf composition (Kubernetes-style)", () => {
    const schema = {
      type: "object",
      properties: {
        deployment: { $ref: "#/definitions/Deployment" },
      },
      definitions: {
        ObjectMeta: {
          type: "object",
          properties: {
            name: { type: "string" },
            namespace: { type: "string" },
            labels: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            annotations: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
        },
        TypeMeta: {
          type: "object",
          properties: {
            apiVersion: { type: "string" },
            kind: { type: "string" },
          },
        },
        LabelSelector: {
          type: "object",
          properties: {
            matchLabels: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            matchExpressions: {
              type: "array",
              items: { $ref: "#/definitions/LabelSelectorRequirement" },
            },
          },
        },
        LabelSelectorRequirement: {
          type: "object",
          properties: {
            key: { type: "string" },
            operator: { type: "string", enum: ["In", "NotIn", "Exists", "DoesNotExist"] },
            values: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        ContainerPort: {
          type: "object",
          properties: {
            name: { type: "string" },
            containerPort: { type: "integer" },
            protocol: { type: "string", enum: ["TCP", "UDP"] },
          },
        },
        EnvVar: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
            valueFrom: { $ref: "#/definitions/EnvVarSource" },
          },
        },
        EnvVarSource: {
          type: "object",
          properties: {
            configMapKeyRef: {
              type: "object",
              properties: {
                name: { type: "string" },
                key: { type: "string" },
              },
            },
            secretKeyRef: {
              type: "object",
              properties: {
                name: { type: "string" },
                key: { type: "string" },
              },
            },
          },
        },
        Container: {
          type: "object",
          properties: {
            name: { type: "string" },
            image: { type: "string" },
            ports: {
              type: "array",
              items: { $ref: "#/definitions/ContainerPort" },
            },
            env: {
              type: "array",
              items: { $ref: "#/definitions/EnvVar" },
            },
            resources: { $ref: "#/definitions/ResourceRequirements" },
          },
        },
        ResourceRequirements: {
          type: "object",
          properties: {
            limits: {
              type: "object",
              properties: {
                cpu: { type: "string" },
                memory: { type: "string" },
              },
            },
            requests: {
              type: "object",
              properties: {
                cpu: { type: "string" },
                memory: { type: "string" },
              },
            },
          },
        },
        PodTemplateSpec: {
          type: "object",
          properties: {
            metadata: { $ref: "#/definitions/ObjectMeta" },
            spec: {
              type: "object",
              properties: {
                containers: {
                  type: "array",
                  items: { $ref: "#/definitions/Container" },
                },
              },
            },
          },
        },
        DeploymentSpec: {
          type: "object",
          properties: {
            replicas: { type: "integer" },
            selector: { $ref: "#/definitions/LabelSelector" },
            template: { $ref: "#/definitions/PodTemplateSpec" },
          },
        },
        Deployment: {
          allOf: [
            { $ref: "#/definitions/TypeMeta" },
            {
              type: "object",
              properties: {
                metadata: { $ref: "#/definitions/ObjectMeta" },
                spec: { $ref: "#/definitions/DeploymentSpec" },
              },
            },
          ],
        },
      },
    };

    it("should dereference deeply nested Kubernetes-style schema", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const deployment = (result as any).definitions.Deployment;
      // TypeMeta should be dereferenced in allOf[0]
      expect(deployment.allOf[0]).to.equal((result as any).definitions.TypeMeta);

      // DeploymentSpec should be dereferenced
      const deploymentSpec = deployment.allOf[1].properties.spec;
      expect(deploymentSpec).to.equal((result as any).definitions.DeploymentSpec);

      // PodTemplateSpec -> Container -> ContainerPort chain
      const template = deploymentSpec.properties.template;
      expect(template).to.equal((result as any).definitions.PodTemplateSpec);

      const container = template.properties.spec.properties.containers.items;
      expect(container).to.equal((result as any).definitions.Container);

      const port = container.properties.ports.items;
      expect(port).to.equal((result as any).definitions.ContainerPort);

      // EnvVar -> EnvVarSource chain
      const envVar = container.properties.env.items;
      expect(envVar).to.equal((result as any).definitions.EnvVar);
      expect(envVar.properties.valueFrom).to.equal((result as any).definitions.EnvVarSource);

      // Resources
      expect(container.properties.resources).to.equal((result as any).definitions.ResourceRequirements);

      // ObjectMeta shared between Deployment and PodTemplateSpec
      expect(deployment.allOf[1].properties.metadata).to.equal(template.properties.metadata);

      expect(parser.$refs.circular).to.equal(false);
    });

    it("should bundle Kubernetes-style schema with all refs intact", async () => {
      const parser = new $RefParser();
      const result = await parser.bundle(structuredClone(schema));

      // All definitions should be preserved
      expect(Object.keys((result as any).definitions)).to.have.lengthOf(12);
    });
  });

  describe("multiple same $ref in different contexts", () => {
    const schema = {
      type: "object",
      properties: {
        primary: { $ref: "#/definitions/Address" },
        shipping: { $ref: "#/definitions/Address" },
        billing: { $ref: "#/definitions/Address" },
        emergency: {
          type: "object",
          properties: {
            contact: { type: "string" },
            address: { $ref: "#/definitions/Address" },
          },
        },
      },
      definitions: {
        Address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip: { type: "string" },
            country: { $ref: "#/definitions/Country" },
          },
        },
        Country: {
          type: "string",
          enum: ["US", "CA", "UK", "AU"],
        },
      },
    };

    it("should share reference equality for same $ref used multiple times", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const primary = (result as any).properties.primary;
      const shipping = (result as any).properties.shipping;
      const billing = (result as any).properties.billing;
      const emergency = (result as any).properties.emergency.properties.address;

      // All four Address refs should resolve to the same object
      expect(primary).to.equal(shipping);
      expect(shipping).to.equal(billing);
      expect(billing).to.equal(emergency);

      // Country ref within Address should also be resolved
      expect(primary.properties.country).to.equal((result as any).definitions.Country);
    });
  });

  describe("oneOf/anyOf with shared definitions (API versioning pattern)", () => {
    const schema = {
      type: "object",
      properties: {
        request: {
          oneOf: [
            { $ref: "#/definitions/V1Request" },
            { $ref: "#/definitions/V2Request" },
          ],
        },
      },
      definitions: {
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1 },
            perPage: { type: "integer", minimum: 1, maximum: 100 },
          },
        },
        SortOrder: {
          type: "string",
          enum: ["asc", "desc"],
        },
        V1Request: {
          type: "object",
          properties: {
            version: { const: 1 },
            query: { type: "string" },
            pagination: { $ref: "#/definitions/Pagination" },
          },
        },
        V2Request: {
          type: "object",
          properties: {
            version: { const: 2 },
            query: { type: "string" },
            filters: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            pagination: { $ref: "#/definitions/Pagination" },
            sort: {
              type: "object",
              properties: {
                field: { type: "string" },
                order: { $ref: "#/definitions/SortOrder" },
              },
            },
          },
        },
      },
    };

    it("should dereference shared definitions across oneOf variants", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const v1 = (result as any).definitions.V1Request;
      const v2 = (result as any).definitions.V2Request;

      // Both V1 and V2 should share the same Pagination ref
      expect(v1.properties.pagination).to.equal(v2.properties.pagination);
      expect(v1.properties.pagination).to.equal((result as any).definitions.Pagination);

      // V2's SortOrder should be dereferenced
      expect(v2.properties.sort.properties.order).to.equal((result as any).definitions.SortOrder);
    });
  });

  describe("nested allOf merging (TypeScript interface extension pattern)", () => {
    const schema = {
      definitions: {
        Serializable: {
          type: "object",
          properties: {
            toJSON: { type: "string" },
          },
        },
        Identifiable: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        Auditable: {
          allOf: [
            { $ref: "#/definitions/Identifiable" },
            {
              type: "object",
              properties: {
                createdBy: { type: "string" },
                updatedBy: { type: "string" },
              },
            },
          ],
        },
        Document: {
          allOf: [
            { $ref: "#/definitions/Auditable" },
            { $ref: "#/definitions/Serializable" },
            {
              type: "object",
              properties: {
                title: { type: "string" },
                body: { type: "string" },
              },
            },
          ],
        },
      },
      $ref: "#/definitions/Document",
    };

    it("should dereference nested allOf extending other allOf schemas", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      const document = (result as any).definitions.Document;
      const auditable = (result as any).definitions.Auditable;
      const identifiable = (result as any).definitions.Identifiable;
      const serializable = (result as any).definitions.Serializable;

      // Document extends Auditable and Serializable
      expect(document.allOf[0]).to.equal(auditable);
      expect(document.allOf[1]).to.equal(serializable);

      // Auditable extends Identifiable
      expect(auditable.allOf[0]).to.equal(identifiable);

      expect(parser.$refs.circular).to.equal(false);
    });
  });

  describe("large flat schema with many $ref (config file pattern)", () => {
    // Simulates a large config schema like VS Code settings or ESLint config
    const definitions: Record<string, any> = {};
    const properties: Record<string, any> = {};

    for (let i = 0; i < 50; i++) {
      definitions[`Setting${i}`] = {
        type: i % 3 === 0 ? "string" : i % 3 === 1 ? "number" : "boolean",
        description: `Setting number ${i}`,
      };
      properties[`setting${i}`] = { $ref: `#/definitions/Setting${i}` };
    }

    const schema = {
      type: "object",
      properties,
      definitions,
    };

    it("should dereference a schema with many definitions efficiently", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));

      // Verify a sampling of properties were dereferenced correctly
      expect((result as any).properties.setting0).to.equal((result as any).definitions.Setting0);
      expect((result as any).properties.setting25).to.equal((result as any).definitions.Setting25);
      expect((result as any).properties.setting49).to.equal((result as any).definitions.Setting49);

      // Verify type mapping
      expect((result as any).definitions.Setting0.type).to.equal("string");
      expect((result as any).definitions.Setting1.type).to.equal("number");
      expect((result as any).definitions.Setting2.type).to.equal("boolean");

      expect(parser.$refs.circular).to.equal(false);
    });
  });
});
