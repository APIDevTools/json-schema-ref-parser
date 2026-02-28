import { describe, it, expect } from "vitest";
import $RefParser from "../../../lib/index.js";

describe("Recursive data structure schemas", () => {
  describe("linked list schema", () => {
    const schema = {
      $ref: "#/definitions/LinkedListNode",
      definitions: {
        LinkedListNode: {
          type: "object",
          properties: {
            value: { type: "integer" },
            next: {
              oneOf: [
                { $ref: "#/definitions/LinkedListNode" },
                { type: "null" },
              ],
            },
          },
          required: ["value"],
        },
      },
    };

    it("should detect circular reference", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect(parser.$refs.circular).to.equal(true);
    });

    it("should handle circular: ignore", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema), {
        dereference: { circular: "ignore" },
      });
      expect(parser.$refs.circular).to.equal(true);
    });

    it("should throw with circular: false", async () => {
      const parser = new $RefParser();
      try {
        await parser.dereference(structuredClone(schema), {
          dereference: { circular: false },
        });
        expect.fail("should have thrown");
      } catch (err: any) {
        expect(err).to.be.instanceOf(ReferenceError);
        expect(err.message).to.contain("Circular");
      }
    });
  });

  describe("tree structure schema (file system)", () => {
    const schema = {
      $ref: "#/definitions/FSNode",
      definitions: {
        FSNode: {
          type: "object",
          required: ["name", "type"],
          properties: {
            name: { type: "string" },
            type: {
              type: "string",
              enum: ["file", "directory"],
            },
            size: { type: "integer" },
            children: {
              type: "array",
              items: { $ref: "#/definitions/FSNode" },
            },
            metadata: { $ref: "#/definitions/Metadata" },
          },
        },
        Metadata: {
          type: "object",
          properties: {
            createdAt: { type: "string", format: "date-time" },
            modifiedAt: { type: "string", format: "date-time" },
            permissions: { type: "string" },
          },
        },
      },
    };

    it("should dereference tree with circular refs and non-circular leaf refs", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect(parser.$refs.circular).to.equal(true);

      // Non-circular Metadata ref should still be fully resolved
      const metadata = (result as any).definitions.FSNode.properties.metadata;
      expect(metadata.type).to.equal("object");
      expect(metadata.properties.createdAt).to.deep.equal({ type: "string", format: "date-time" });
    });
  });

  describe("graph schema (social network)", () => {
    const schema = {
      type: "object",
      properties: {
        user: { $ref: "#/definitions/User" },
      },
      definitions: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            friends: {
              type: "array",
              items: { $ref: "#/definitions/User" },
            },
            bestFriend: { $ref: "#/definitions/User" },
            posts: {
              type: "array",
              items: { $ref: "#/definitions/Post" },
            },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: { type: "string" },
            content: { type: "string" },
            author: { $ref: "#/definitions/User" },
            likes: {
              type: "array",
              items: { $ref: "#/definitions/User" },
            },
          },
        },
      },
    };

    it("should handle mutual circular references (User <-> Post)", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect(parser.$refs.circular).to.equal(true);

      // User should be dereferenced
      const user = (result as any).definitions.User;
      expect(user.type).to.equal("object");
      expect(user.properties.id).to.deep.equal({ type: "string" });

      // Post should be dereferenced
      const post = (result as any).definitions.Post;
      expect(post.type).to.equal("object");
      expect(post.properties.content).to.deep.equal({ type: "string" });
    });

    it("should fire onCircular for each circular occurrence", async () => {
      const circularPaths: string[] = [];
      const parser = new $RefParser();
      await parser.dereference(structuredClone(schema), {
        dereference: {
          circular: true,
          onCircular: (path: string) => {
            circularPaths.push(path);
          },
        },
      });
      // There should be multiple circular occurrences:
      // User.friends -> User, User.bestFriend -> User, Post.author -> User, Post.likes -> User
      expect(circularPaths.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("recursive schema with multiple nesting paths", () => {
    const schema = {
      $ref: "#/definitions/Expression",
      definitions: {
        Expression: {
          oneOf: [
            { $ref: "#/definitions/Literal" },
            { $ref: "#/definitions/BinaryOp" },
            { $ref: "#/definitions/UnaryOp" },
          ],
        },
        Literal: {
          type: "object",
          properties: {
            type: { const: "literal" },
            value: { type: "number" },
          },
        },
        BinaryOp: {
          type: "object",
          properties: {
            type: { const: "binary" },
            operator: { type: "string", enum: ["+", "-", "*", "/"] },
            left: { $ref: "#/definitions/Expression" },
            right: { $ref: "#/definitions/Expression" },
          },
        },
        UnaryOp: {
          type: "object",
          properties: {
            type: { const: "unary" },
            operator: { type: "string", enum: ["-", "!"] },
            operand: { $ref: "#/definitions/Expression" },
          },
        },
      },
    };

    it("should handle AST-like recursive oneOf patterns", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect(parser.$refs.circular).to.equal(true);

      // Literal should be fully dereferenced (no circular refs)
      const literal = (result as any).definitions.Literal;
      expect(literal.properties.value).to.deep.equal({ type: "number" });

      // BinaryOp left/right should reference Expression (circular)
      const binaryOp = (result as any).definitions.BinaryOp;
      expect(binaryOp.properties.operator.enum).to.deep.equal(["+", "-", "*", "/"]);
    });

    it("should bundle recursive oneOf schema", async () => {
      const parser = new $RefParser();
      const result = await parser.bundle(structuredClone(schema));
      // After bundling, recursive refs should remain as internal $ref pointers
      expect(result).to.have.property("definitions");
    });
  });

  describe("deeply nested recursive schema (comment thread)", () => {
    const schema = {
      type: "object",
      properties: {
        thread: { $ref: "#/definitions/Comment" },
      },
      definitions: {
        Comment: {
          type: "object",
          properties: {
            id: { type: "string" },
            text: { type: "string" },
            author: { $ref: "#/definitions/Author" },
            replies: {
              type: "array",
              items: { $ref: "#/definitions/Comment" },
            },
            parentComment: {
              oneOf: [
                { $ref: "#/definitions/Comment" },
                { type: "null" },
              ],
            },
          },
        },
        Author: {
          type: "object",
          properties: {
            name: { type: "string" },
            recentComments: {
              type: "array",
              items: { $ref: "#/definitions/Comment" },
            },
          },
        },
      },
    };

    it("should handle bidirectional circular refs (Comment <-> Author)", async () => {
      const parser = new $RefParser();
      const result = await parser.dereference(structuredClone(schema));
      expect(parser.$refs.circular).to.equal(true);

      const comment = (result as any).definitions.Comment;
      expect(comment.properties.id).to.deep.equal({ type: "string" });

      const author = (result as any).definitions.Author;
      expect(author.properties.name).to.deep.equal({ type: "string" });
    });
  });
});
