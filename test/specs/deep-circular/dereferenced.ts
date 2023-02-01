const name = {
  required: ["first", "last"],
  type: "object",
  properties: {
    middle: {
      minLength: 1,
      type: "string",
    },
    prefix: {
      minLength: 3,
      type: "string",
      title: "requiredString",
    },
    last: {
      minLength: 1,
      type: "string",
      title: "requiredString",
    },
    suffix: {
      minLength: 3,
      maxLength: 3,
      type: "string",
      title: "requiredString",
    },
    first: {
      minLength: 1,
      type: "string",
      title: "requiredString",
    },
  },
  title: "name",
};

const dereferencedSchema = {
  title: "Deep Schema",
  type: "object",
  definitions: {
    name,
  },
  properties: {
    level1: {
      required: ["name"],
      type: "object",
      properties: {
        level2: {
          required: ["name"],
          type: "object",
          properties: {
            level3: {
              required: ["name"],
              type: "object",
              properties: {
                level4: {
                  required: ["name"],
                  type: "object",
                  properties: {
                    name,
                    level5: {
                      required: ["name"],
                      type: "object",
                      properties: {
                        name,
                        level6: {
                          required: ["name"],
                          type: "object",
                          properties: {
                            name,
                            level7: {
                              required: ["name"],
                              type: "object",
                              properties: {
                                level8: {
                                  required: ["name"],
                                  type: "object",
                                  properties: {
                                    level9: {
                                      required: ["name"],
                                      type: "object",
                                      properties: {
                                        level10: {
                                          required: ["name"],
                                          type: "object",
                                          properties: {
                                            level11: {
                                              required: ["name"],
                                              type: "object",
                                              properties: {
                                                level12: {
                                                  required: ["name"],
                                                  type: "object",
                                                  properties: {
                                                    level13: {
                                                      required: ["name"],
                                                      type: "object",
                                                      properties: {
                                                        name,
                                                        level14: {
                                                          required: ["name"],
                                                          type: "object",
                                                          properties: {
                                                            name,
                                                            level15: {
                                                              required: ["name"],
                                                              type: "object",
                                                              properties: {
                                                                level16: {
                                                                  required: ["name"],
                                                                  type: "object",
                                                                  properties: {
                                                                    name,
                                                                    level17: {
                                                                      required: ["name"],
                                                                      type: "object",
                                                                      properties: {
                                                                        level18: {
                                                                          required: ["name"],
                                                                          type: "object",
                                                                          properties: {
                                                                            level19: {
                                                                              required: ["name"],
                                                                              type: "object",
                                                                              properties: {
                                                                                level20: {
                                                                                  required: ["name"],
                                                                                  type: "object",
                                                                                  properties: {
                                                                                    level21: {
                                                                                      required: ["name"],
                                                                                      type: "object",
                                                                                      properties: {
                                                                                        level22: {
                                                                                          required: ["name"],
                                                                                          type: "object",
                                                                                          properties: {
                                                                                            level23: {
                                                                                              required: ["name"],
                                                                                              type: "object",
                                                                                              properties: {
                                                                                                name,
                                                                                                level24: {
                                                                                                  required: ["name"],
                                                                                                  type: "object",
                                                                                                  properties: {
                                                                                                    name,
                                                                                                    level25: {
                                                                                                      required: [
                                                                                                        "name",
                                                                                                      ],
                                                                                                      type: "object",
                                                                                                      properties: {
                                                                                                        name,
                                                                                                        level26: {
                                                                                                          required: [
                                                                                                            "name",
                                                                                                          ],
                                                                                                          type: "object",
                                                                                                          properties: {
                                                                                                            level27: {
                                                                                                              required:
                                                                                                                [
                                                                                                                  "name",
                                                                                                                ],
                                                                                                              type: "object",
                                                                                                              properties:
                                                                                                                {
                                                                                                                  level28:
                                                                                                                    {
                                                                                                                      required:
                                                                                                                        [
                                                                                                                          "name",
                                                                                                                        ],
                                                                                                                      type: "object",
                                                                                                                      properties:
                                                                                                                        {
                                                                                                                          level29:
                                                                                                                            {
                                                                                                                              required:
                                                                                                                                [
                                                                                                                                  "name",
                                                                                                                                ],
                                                                                                                              type: "object",
                                                                                                                              properties:
                                                                                                                                {
                                                                                                                                  name,
                                                                                                                                },
                                                                                                                            },
                                                                                                                          name,
                                                                                                                        },
                                                                                                                    },
                                                                                                                  name,
                                                                                                                },
                                                                                                            },
                                                                                                            name,
                                                                                                          },
                                                                                                        },
                                                                                                      },
                                                                                                    },
                                                                                                  },
                                                                                                },
                                                                                              },
                                                                                            },
                                                                                            name,
                                                                                          },
                                                                                        },
                                                                                        name,
                                                                                      },
                                                                                    },
                                                                                    name,
                                                                                  },
                                                                                },
                                                                                name,
                                                                              },
                                                                            },
                                                                            name,
                                                                          },
                                                                        },
                                                                        name,
                                                                      },
                                                                    },
                                                                  },
                                                                },
                                                                name,
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                    name,
                                                  },
                                                },
                                                name,
                                              },
                                            },
                                            name,
                                          },
                                        },
                                        name,
                                      },
                                    },
                                    name,
                                  },
                                },
                                name,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                name,
              },
            },
            name,
          },
        },
        name,
      },
    },
    name,
  },
};

// @ts-expect-error TS(2339): Property 'level30' does not exist on type '{ name:... Remove this comment to see the full error message
dereferencedSchema.properties.level1.properties.level2.properties.level3.properties.level4.properties.level5.properties.level6.properties.level7.properties.level8.properties.level9.properties.level10.properties.level11.properties.level12.properties.level13.properties.level14.properties.level15.properties.level16.properties.level17.properties.level18.properties.level19.properties.level20.properties.level21.properties.level22.properties.level23.properties.level24.properties.level25.properties.level26.properties.level27.properties.level28.properties.level29.properties.level30 =
  dereferencedSchema;

export default dereferencedSchema;
