export default {
  info: {
    title: "Main",
  },
  paths: {
    "/test/add-test": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Test1",
              },
            },
          },
        },
        responses: {
          204: {
            description: "No Content",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      "Common.Test3": {
        properties: {
          test5: {
            items: {
              properties: {
                test5A: {
                  properties: {
                    test6: {
                      items: {
                        properties: {
                          type: {
                            enum: ["VALUE1", "VALUE2", "VALUE3"],
                          },
                          value: {
                            format: "double",
                            type: "number",
                          },
                        },
                      },
                    },
                  },
                },
                test5B: {
                  properties: {
                    test6: {
                      items: {
                        $ref: "#/components/schemas/Common.Test3/properties/test5/items/properties/test5A/properties/test6/items",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      Test1: {
        properties: {
          test2: {
            $ref: "#/components/schemas/Test2",
          },
        },
      },
      Test2: {
        properties: {
          test3: {
            $ref: "#/components/schemas/Common.Test3",
          },
        },
      },
    },
  },
};
