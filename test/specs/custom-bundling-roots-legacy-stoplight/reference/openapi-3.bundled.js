/* eslint-disable */
module.exports = {
  openapi: "3.0",
  info: {
    title: "Foo",
    version: "1.0"
  },
  servers: [
    {
      url: "http://localhost:3000"
    }
  ],
  paths: {
    "/flight/{id}": {
      parameters: [
        {
          $ref: "#/components/parameters/Id"
        }
      ],
      get: {
        operationId: "get-flights",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Flight"
                }
              }
            }
          }
        }
      },
      post: {
        operationId: "post-flight-id",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Flight_2"
              }
            }
          }
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Flight"
                }
              }
            },
            headers: {
              "X-RateLimit-Remaining": {
                $ref: "#/components/headers/X-RateLimit-Remaining",
              },
            }
          }
        }
      },
      patch: {
        operationId: "patch-flight-id",
        requestBody: {
          $ref: "#/components/requestBodies/ExampleRequestBody",
        },
      },
    }
  },
  components: {
    parameters: {
      Id: {
        in: "path",
        name: "id",
        required: true,
        type: "number",
      },
    },
    requestBodies: {
      ExampleRequestBody: {
        content: {
          "application/json": {
            schema: {
              name: "title",
              type: "string",
            },
          },
        },
        description: "example request body",
        required: true,
      },
    },
    headers: {
      "X-RateLimit-Remaining": {
        description: "Request limit per hour",
        example: 100,
        schema: {
          type: "integer",
        },
      },
    },
    schemas: {
      Airport: {
        definitions: {
          Name: {
            example: "JFK",
            maxLength: 50,
            minLength: 2,
            type: "string"
          }
        },
        properties: {
          id: {
            type: "number"
          },
          name: {
            $ref: "#/components/schemas/Airport/definitions/Name"
          }
        },
        title: "Airport",
        type: "object"
      },
      Airport_m123: {
        definitions: {
          Name: {
            example: "JFK",
            maxLength: 50,
            minLength: 2,
            type: "string"
          }
        },
        properties: {
          name: {
            $ref: "#/components/schemas/Airport_m123/definitions/Name"
          }
        },
        title: "Airport",
        type: "object"
      },
      Flight: {
        title: "Flight",
        type: "object",
        properties: {
          id: {
            type: "string"
          },
          flight: {
            $ref: "#/components/schemas/Flight_2"
          }
        }
      },
      Flight_2: {
        properties: {
          airplane: {
            $ref: "#/components/schemas/Airplane.v1"
          },
          airport: {
            $ref: "#/components/schemas/Airport"
          },
          airport_masked: {
            $ref: "#/components/schemas/Airport_m123"
          },
          pilot: {
            $ref: "#/components/schemas/User"
          }
        },
        title: "Flight",
        type: "object"
      },

      User: {
        definitions: {
          Name: {
            type: "string",
            minLength: 2,
            maxLength: 20
          }
        },
        title: "User",
        type: "object",
        properties: {
          firstName: {
            $ref: "#/components/schemas/User/definitions/Name"
          },
          lastName: {
            $ref: "#/components/schemas/User/definitions/Name"
          }
        }
      },
      'Airplane.v1': {
        definitions: {
          Name: {
            example: "747",
            maxLength: 100,
            minLength: 1,
            type: "string",
          },
        },
        title: "Airplane",
        type: "object",
        properties: {
          name: {
            $ref: "#/components/schemas/Airplane.v1/definitions/Name"
          },
          repairman: {
            $ref: "#/components/schemas/User"
          },
          manufacturer: {
            $ref: "#/components/schemas/Manufacturer"
          }
        }
      },
      Manufacturer: {
        definitions: {
          Name: {
            maxLength: 20,
            minLength: 2,
            type: "string",
          }
        },
        title: "Manufacturer",
        type: "object",
        properties: {
          name: {
            $ref: "#/components/schemas/Manufacturer/definitions/Name"
          },
          owner: {
            $ref: "#/components/schemas/User_2"
          }
        }
      },
      User_2: {
        definitions: {
          Name: {
            type: "string",
            minLength: 2,
            maxLength: 50
          }
        },
        title: "Alt User",
        description: "Allows for a longer name than regular user",
        type: "object",
        properties: {
          firstName: {
            $ref: "#/components/schemas/User_2/definitions/Name"
          },
          lastName: {
            $ref: "#/components/schemas/User_2/definitions/Name"
          }
        }
      }
    }
  }
};
