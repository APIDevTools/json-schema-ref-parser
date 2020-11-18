/* eslint-disable */
module.exports = {
  swagger: "2.0",
  info: {
    title: "Foo",
    version: "1.0"
  },
  host: "localhost:3000",
  paths: {
    "/flight/{id}": {
      parameters: [
        {
          type: "number",
          name: "id",
          in: "path",
          required: true
        }
      ],
      get: {
        operationId: "get-flights",
        responses: {
          200: {
            description: "OK",
            schema: {
              $ref: "#/definitions/Flight"
            }
          }
        }
      },
      post: {
        operationId: "post-flight-id",
        parameters: [
          {
            in: "body",
            name: "body",
            schema: {
              $ref: "#/definitions/Flight_2"
            }
          }
        ],
        responses: {
          200: {
            description: "OK",
            schema: {
              $ref: "#/definitions/Flight"
            }
          }
        }
      }
    }
  },
  definitions: {
    Flight: {
      title: "Flight",
      type: "object",
      properties: {
        id: {
          type: "string"
        },
        flight: {
          $ref: "#/definitions/Flight_2"
        }
      }
    },
    Flight_2: {
      properties: {
        airplane: {
          $ref: "#/definitions/Airplane_V1"
        },
        airport: {
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
              $ref: "#/definitions/Flight_2/properties/airport/definitions/Name"
            }
          },
          title: "Airport",
          type: "object",
        },
        airport_masked: {
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
              $ref: "#/definitions/Flight_2/properties/airport_masked/definitions/Name"
            },
          },
          title: "Airport",
          type: "object"
        },
        pilot: {
          $ref: "#/definitions/User"
        }
      },
      title: "Flight",
      type: "object"
    },
    User: {
      definitions: {},
      title: "User",
      type: "object",
      properties: {
        firstName: {
          $ref: "#/definitions/User_Name"
        },
        lastName: {
          $ref: "#/definitions/User_Name"
        }
      }
    },
    User_Name: {
      type: "string",
      minLength: 2,
      maxLength: 20
    },
    Airplane_V1: {
      definitions: {},
      title: "Airplane",
      type: "object",
      properties: {
        name: {
          $ref: "#/definitions/Airplane_V1_Name"
        },
        repairman: {
          $ref: "#/definitions/User"
        },
        manufacturer: {
          $ref: "#/definitions/Manufacturer"
        }
      }
    },
    Airplane_V1_Name: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      example: "747"
    },
    Manufacturer: {
      definitions: {},
      title: "Manufacturer",
      type: "object",
      properties: {
        name: {
          $ref: "#/definitions/Manufacturer_Name"
        },
        owner: {
          $ref: "#/definitions/User_2"
        }
      }
    },
    Manufacturer_Name: {
      type: "string",
      minLength: 2,
      maxLength: 20
    },
    User_2: {
      definitions: {},
      title: "Alt User",
      description: "Allows for a longer name than regular user",
      type: "object",
      properties: {
        firstName: {
          $ref: "#/definitions/User_2_Name"
        },
        lastName: {
          $ref: "#/definitions/User_2_Name"
        }
      }
    },
    User_2_Name: {
      type: "string",
      minLength: 2,
      maxLength: 50
    },
  }
};
