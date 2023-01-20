export default {
  info: {
    title: "Main"
  },
  paths: {
    "/test/add-test": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Test1"
              }
            }
          }
        },
        responses: {
          204: {
            description: "No Content",
          }
        }
      }
    }
  },
  components: {
    schemas: {
      "Common.Test3": {
        $ref: "#/components/schemas/Test4"
      },
      Test1: {
        properties: {
          test2: {
            $ref: "#/components/schemas/Test2"
          }
        }
      },
      Test2: {
        properties: {
          test3: {
            $ref: "#/components/schemas/Test4"
          }
        }
      },
      Test4: {
        properties: {
          test5: {
            items: {
              $ref: "#/components/schemas/Test5"
            }
          }
        }
      },
      Test5: {
        properties: {
          test5A: {
            $ref: "#/components/schemas/Test5A"
          },
          test5B: {
            $ref: "#/components/schemas/Test5B"
          }
        }
      },
      Test5A: {
        properties: {
          test6: {
            items: {
              $ref: "#/components/schemas/Test6"
            }
          }
        }
      },
      Test5B: {
        properties: {
          test6: {
            items: {
              $ref: "#/components/schemas/Test6"
            }
          }
        }
      },
      Test6: {
        properties: {
          type: {
            $ref: "#/components/schemas/Test7Type"
          },
          value: {
            format: "double",
            type: "number"
          }
        }
      },
      Test7Type: {
        enum: [
          "VALUE1",
          "VALUE2",
          "VALUE3"
        ]
      }
    }
  }
};
