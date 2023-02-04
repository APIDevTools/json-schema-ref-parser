export default {
  schema: {
    title: "Deep Schema",
    definitions: {
      name: {
        $ref: "definitions/name.yaml",
      },
    },
    type: "object",
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
                      name: {
                        $ref: "definitions/name.yaml",
                      },
                      level5: {
                        required: ["name"],
                        type: "object",
                        properties: {
                          name: {
                            $ref: "definitions/name.yaml",
                          },
                          level6: {
                            required: ["name"],
                            type: "object",
                            properties: {
                              name: {
                                $ref: "#/definitions/name",
                              },
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
                                                          name: {
                                                            $ref: "#/definitions/name",
                                                          },
                                                          level14: {
                                                            required: ["name"],
                                                            type: "object",
                                                            properties: {
                                                              name: {
                                                                $ref: "definitions/name.yaml",
                                                              },
                                                              level15: {
                                                                required: ["name"],
                                                                type: "object",
                                                                properties: {
                                                                  level16: {
                                                                    required: ["name"],
                                                                    type: "object",
                                                                    properties: {
                                                                      name: {
                                                                        $ref: "definitions/name.yaml",
                                                                      },
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
                                                                                                  name: {
                                                                                                    $ref: "definitions/name.yaml",
                                                                                                  },
                                                                                                  level24: {
                                                                                                    required: ["name"],
                                                                                                    type: "object",
                                                                                                    properties: {
                                                                                                      name: {
                                                                                                        $ref: "definitions/name.yaml",
                                                                                                      },
                                                                                                      level25: {
                                                                                                        required: [
                                                                                                          "name",
                                                                                                        ],
                                                                                                        type: "object",
                                                                                                        properties: {
                                                                                                          name: {
                                                                                                            $ref: "definitions/name.yaml",
                                                                                                          },
                                                                                                          level26: {
                                                                                                            required: [
                                                                                                              "name",
                                                                                                            ],
                                                                                                            type: "object",
                                                                                                            properties:
                                                                                                              {
                                                                                                                level27:
                                                                                                                  {
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
                                                                                                                                        level30:
                                                                                                                                          {
                                                                                                                                            $ref: "#",
                                                                                                                                          },
                                                                                                                                        name: {
                                                                                                                                          $ref: "definitions/name.yaml",
                                                                                                                                        },
                                                                                                                                      },
                                                                                                                                  },
                                                                                                                                name: {
                                                                                                                                  $ref: "definitions/name.yaml",
                                                                                                                                },
                                                                                                                              },
                                                                                                                          },
                                                                                                                        name: {
                                                                                                                          $ref: "definitions/name.yaml",
                                                                                                                        },
                                                                                                                      },
                                                                                                                  },
                                                                                                                name: {
                                                                                                                  $ref: "#/definitions/name",
                                                                                                                },
                                                                                                              },
                                                                                                          },
                                                                                                        },
                                                                                                      },
                                                                                                    },
                                                                                                  },
                                                                                                },
                                                                                              },
                                                                                              name: {
                                                                                                $ref: "definitions/name.yaml",
                                                                                              },
                                                                                            },
                                                                                          },
                                                                                          name: {
                                                                                            $ref: "definitions/name.yaml",
                                                                                          },
                                                                                        },
                                                                                      },
                                                                                      name: {
                                                                                        $ref: "definitions/name.yaml",
                                                                                      },
                                                                                    },
                                                                                  },
                                                                                  name: {
                                                                                    $ref: "definitions/name.yaml",
                                                                                  },
                                                                                },
                                                                              },
                                                                              name: {
                                                                                $ref: "definitions/name.yaml",
                                                                              },
                                                                            },
                                                                          },
                                                                          name: {
                                                                            $ref: "definitions/name.yaml",
                                                                          },
                                                                        },
                                                                      },
                                                                    },
                                                                  },
                                                                  name: {
                                                                    $ref: "definitions/name.yaml",
                                                                  },
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                      name: {
                                                        $ref: "#/definitions/name",
                                                      },
                                                    },
                                                  },
                                                  name: {
                                                    $ref: "definitions/name.yaml",
                                                  },
                                                },
                                              },
                                              name: {
                                                $ref: "definitions/name.yaml",
                                              },
                                            },
                                          },
                                          name: {
                                            $ref: "definitions/name.yaml",
                                          },
                                        },
                                      },
                                      name: {
                                        $ref: "definitions/name.yaml",
                                      },
                                    },
                                  },
                                  name: {
                                    $ref: "definitions/name.yaml",
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  name: {
                    $ref: "#/definitions/name",
                  },
                },
              },
              name: {
                $ref: "definitions/name.yaml",
              },
            },
          },
          name: {
            $ref: "definitions/name.yaml",
          },
        },
      },
      name: {
        $ref: "#/definitions/name",
      },
    },
  },

  name: {
    required: ["first", "last"],
    type: "object",
    properties: {
      middle: {
        minLength: {
          $ref: "#/properties/first/minLength",
        },
        type: {
          $ref: "#/properties/first/type",
        },
      },
      prefix: {
        minLength: 3,
        $ref: "#/properties/last",
      },
      last: {
        $ref: "./required-string.yaml",
      },
      suffix: {
        $ref: "#/properties/prefix",
        type: "string",
        maxLength: 3,
      },
      first: {
        $ref: "../definitions/required-string.yaml",
      },
    },
    title: "name",
  },

  requiredString: {
    minLength: 1,
    type: "string",
    title: "requiredString",
  },
};
