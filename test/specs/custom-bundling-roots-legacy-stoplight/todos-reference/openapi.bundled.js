/* eslint-disable */
module.exports = {
  swagger: "2.0",
  info: {
    title: "To-dos",
    version: "1.0",
    description:
      "This OpenAPI v2 (Swagger) file represents a real API that lives at http://todos.stoplight.io.\n\nIt exposes functionality to manage to-do lists.",
    contact: {
      name: "Stoplight",
      url: "https://stoplight.io",
    },
    license: {
      name: "MIT",
    },
  },
  host: "todos.stoplight.io",
  schemes: ["https", "http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  securityDefinitions: {
    apikey: {
      name: "apikey",
      type: "apiKey",
      in: "query",
      description:
        "Use `?apikey=123` to authenticate requests. It's super secure.",
    },
  },
  tags: [
    {
      name: "Todos",
    },
  ],
  paths: {
    "/todos/{todoId}": {
      parameters: [
        {
          $ref: "#/parameters/todoId",
        },
      ],
      get: {
        operationId: "GET_todo",
        summary: "Get Todo",
        tags: ["Todos"],
        responses: {
          200: {
            description: "",
            schema: {
              $ref: "#/definitions/Todo-full",
            },
            examples: {
              "application/json": {
                id: 1,
                name: "get food",
                completed: false,
                completed_at: "1955-04-23T13:22:52.685Z",
                created_at: "1994-11-05T03:26:51.471Z",
                updated_at: "1989-07-29T11:30:06.701Z",
              },
            },
          },
          404: {
            $ref: "#/responses/Shared_404"

          },
          420: {
            $ref: "#/responses/420",
          },
          500: {
            $ref: "#/responses/Shared_500"
          },
        },
      },
      put: {
        operationId: "PUT_todos",
        summary: "Update Todo",
        tags: ["Todos"],
        parameters: [
          {
            name: "body",
            in: "body",
            schema: {
              $ref: "#/definitions/Todo-partial",
              example: {
                name: "my todo's new name",
                completed: false,
              },
            },
          },
        ],
        responses: {
          200: {
            description: "",
            schema: {
              $ref: "#/definitions/Todo-full",
            },
            examples: {
              "application/json": {
                id: 9000,
                name: "It's Over 9000!!!",
                completed: true,
                completed_at: null,
                created_at: "2014-08-28T14:14:28.494Z",
                updated_at: "2015-08-28T14:14:28.494Z",
              },
            },
          },
          401: {
            $ref: "#/responses/Shared_401"
          },
          404: {
            $ref: "#/responses/Shared_404"
          },
          500: {
            $ref: "#/responses/Shared_500"
          },
        },
        security: [
          {
            apikey: [],
          },
        ],
      },
      delete: {
        operationId: "DELETE_todo",
        summary: "Delete Todo",
        tags: ["Todos"],
        responses: {
          204: {
            description: "",
          },
          401: {
            $ref: "#/responses/Shared_401"
          },
          404: {
            $ref: "#/responses/Shared_404"
          },
          500: {
            $ref: "#/responses/Shared_500"
          },
        },
        security: [
          {
            apikey: [],
          },
        ],
      },
    },
    "/todos": {
      post: {
        operationId: "POST_todos",
        summary: "Create Todo",
        tags: ["Todos"],
        parameters: [
          {
            name: "body",
            in: "body",
            schema: {
              $ref: "#/definitions/Todo-partial",
              example: {
                name: "my todo's name",
                completed: false,
              },
            },
          },
        ],
        responses: {
          201: {
            description: "",
            schema: {
              $ref: "#/definitions/Todo-full",
            },
            examples: {
              "application/json": {
                id: 9000,
                name: "It's Over 9000!!!",
                completed: null,
                completed_at: null,
                created_at: "2014-08-28T14:14:28.494Z",
                updated_at: "2014-08-28T14:14:28.494Z",
              },
            },
          },
          401: {
            $ref: "#/responses/Shared_401"
          },
          500: {
            $ref: "#/responses/Shared_500"
          },
        },
        security: [
          {
            apikey: [],
          },
        ],
        description: "This creates a Todo object.\n\nTesting `inline code`.",
      },
      get: {
        operationId: "GET_todos",
        summary: "List Todos",
        tags: ["Todos"],
        responses: {
          200: {
            description: "",
            schema: {
              type: "array",
              items: {
                $ref: "#/definitions/Todo-full",
              },
            },
            examples: {
              "application/json": [
                {
                  id: 1,
                  name: "design the thingz",
                  completed: true,
                },
                {
                  id: 2,
                  name: "mock the thingz",
                  completed: true,
                },
                {
                  id: 3,
                  name: "code the thingz",
                  completed: false,
                },
              ],
            },
          },
          500: {
            $ref: "#/responses/Shared_500"
          },
        },
      },
    },
  },
  parameters: {
    todoId: {
      name: "todoId",
      in: "path",
      required: true,
      type: "string",
    },
  },
  responses: {
    420: {
      description: "Stay calm and carry on. Should render the user model",
      schema: {
        $ref: "#/definitions/User",
      },
    },
    Shared_401: {
      description: "Our shared 401 response.",
      examples: {
        "application/json": {
          code: "401",
          message: "Not Authorized"
        }
      },
      schema: {
        $ref: "#/definitions/Error"
      }
    },
    Shared_404: {
      description: "Our shared 404 response.",
      examples: {
        "application/json": {
          code: "404",
          message: "Not Found"
        }
      },
      schema: {
        $ref: "#/definitions/Error"
      }
    },
    Shared_500: {
      description: "Our shared 500 response.",
      examples: {
        "application/json": {
          code: "500",
          message: "Server Error"
        }
      },
      schema: {
        $ref: "#/definitions/Error"
      }
    }
  },
  definitions: {
    embedded: {
      title: "Embedded Model",
      properties: {
        id: {
          type: "string",
        },
        todo: {
          $ref: "#/definitions/Todo-full",
        },
      },
    },
    Error: {
      title: "Error",
      type: "object",
      description: "A standard error object.",
      "x-tags": ["Common"],
      properties: {
        code: {
          type: "string",
          description: "A code.",
        },
        message: {
          type: "string",
        },
      },
      required: ["code"],
    },
    Card: {
      title: "card",
      type: "object",
      description: "",
      properties: {
        id: {
          type: "string",
        },
        number: {
          type: "string",
        },
      },
      required: ["number"],
    },
    "Todo-full": {
      title: "Todo Full",
      allOf: [
        {
          $ref: "#/definitions/Todo-partial",
        },
        {
          type: "object",
          properties: {
            id: {
              type: "integer",
              minimum: 0,
              maximum: 1000000,
            },
            completed_at: {
              type: ["string", "null"],
              format: "date-time",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
            user: {
              $ref: "#/definitions/User",
            },
          },
          required: ["id", "user"],
        },
      ],
      "x-tags": ["Todos"],
    },
    "Todo-partial": {
      title: "Todo Partial",
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        completed: {
          type: ["boolean", "null"],
        },
      },
      required: ["name", "completed"],
      "x-tags": ["Todos"],
    },
    User: {
      title: "User",
      type: "object",
      "x-tags": ["Todos"],
      properties: {
        name: {
          type: "string",
          description: "The user's full name.",
        },
        age: {
          type: "number",
          minimum: 0,
          maximum: 150,
        },
        card: {
          $ref: "#/definitions/Card",
        },
      },
      required: ["name", "age"],
    },
  },
};
