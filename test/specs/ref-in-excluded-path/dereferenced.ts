export default {
  components: {
    examples: {
      "confirmation-failure": {
        value: {
          $ref: "#/literal-component-example",
        },
      },
      "confirmation-success": {
        value: {
          abc: "def",
        },
      },
      "query-example": {
        value: "abc",
      },
    },
    parameters: {
      a: {
        example: {
          $ref: "#/literal-param-component-example",
        },
      },
      b: {
        examples: {
          example1: {
            value: {
              $ref: "#/literal-param-component-examples1",
            },
          },
        },
      },
    },
  },
  paths: {
    "/x/{id}": {
      parameters: [
        {
          example: 123,
          in: "path",
          name: "id",
        },
        {
          examples: {
            e1: {
              value: {
                $ref: "#/literal-h1",
              },
            },
          },
          in: "header",
          name: "h1",
        },
        {
          example: {
            $ref: "#/literal-q1",
          },
          in: "query",
          name: "q1",
        },
        {
          examples: {
            q2: {
              value: "abc",
            },
          },
          in: "query",
          name: "q2",
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              examples: {
                "confirmation-failure": {
                  value: {
                    $ref: "#/literal-component-example",
                  },
                },
                "confirmation-in-progress": {
                  summary: "In progress response",
                  value: {
                    $ref: "#/abc",
                  },
                },
                "confirmation-success": {
                  value: {
                    abc: "def",
                  },
                },
              },
            },
          },
        },
        400: {
          content: {
            "application/json": {
              example: {
                $ref: "#/literal-example",
              },
            },
          },
        },
      },
    },
  },
};
