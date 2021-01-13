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
          $ref: "#/components/schemas/Id"
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
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Airport: {
        definitions: {},
        properties: {
          id: {
            type: "number"
          },
          name: {
            $ref: "#/components/schemas/Airport_Name"
          }
        },
        title: "Airport",
        type: "object"
      },
      Airport_m123: {
        definitions: {},
        properties: {
          name: {
            $ref: "#/components/schemas/Airport_m123_Name"
          }
        },
        title: "Airport",
        type: "object"
      },
      Airport_Name: {
        example: "JFK",
        maxLength: 50,
        minLength: 2,
        type: "string"
      },
      Airport_m123_Name: {
        example: "JFK",
        maxLength: 50,
        minLength: 2,
        type: "string"
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
        definitions: {},
        title: "User",
        type: "object",
        properties: {
          firstName: {
            $ref: "#/components/schemas/User_Name"
          },
          lastName: {
            $ref: "#/components/schemas/User_Name"
          }
        }
      },
      User_Name: {
        type: "string",
        minLength: 2,
        maxLength: 20
      },
      'Airplane.v1': {
        definitions: {},
        title: "Airplane",
        type: "object",
        properties: {
          name: {
            $ref: "#/components/schemas/Airplane.v1_Name"
          },
          repairman: {
            $ref: "#/components/schemas/User"
          },
          manufacturer: {
            $ref: "#/components/schemas/Manufacturer"
          }
        }
      },
      'Airplane.v1_Name': {
        type: "string",
        minLength: 1,
        maxLength: 100,
        example: "747"
      },
      Id: {
        in: "path",
        name: "id",
        required: true,
        type: "number"
      },
      Manufacturer: {
        definitions: {},
        title: "Manufacturer",
        type: "object",
        properties: {
          name: {
            $ref: "#/components/schemas/Manufacturer_Name"
          },
          owner: {
            $ref: "#/components/schemas/User_2"
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
            $ref: "#/components/schemas/User_2_Name"
          },
          lastName: {
            $ref: "#/components/schemas/User_2_Name"
          }
        }
      },
      User_2_Name: {
        type: "string",
        minLength: 2,
        maxLength: 50
      },
    }
  }
};
