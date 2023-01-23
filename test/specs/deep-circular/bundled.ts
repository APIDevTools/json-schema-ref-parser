export default {
  title: "Deep Schema",
  type: "object",
  definitions: {
    name: {
      title: "name",
      required: ["first", "last"],
      type: "object",
      properties: {
        middle: {
          minLength: {
            $ref: "#/definitions/name/properties/last/minLength",
          },
          type: {
            $ref: "#/definitions/name/properties/last/type",
          },
        },
        prefix: {
          minLength: 3,
          $ref: "#/definitions/name/properties/last",
        },
        last: {
          minLength: 1,
          type: "string",
          title: "requiredString",
        },
        suffix: {
          $ref: "#/definitions/name/properties/prefix",
          type: "string",
          maxLength: 3,
        },
        first: {
          $ref: "#/definitions/name/properties/last",
        },
      },
    },
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
                    name: {
                      $ref: "#/definitions/name",
                    },
                    level5: {
                      required: ["name"],
                      type: "object",
                      properties: {
                        name: {
                          $ref: "#/definitions/name",
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
                                                              $ref: "#/definitions/name",
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
                                                                      $ref: "#/definitions/name",
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
                                                                                                  $ref: "#/definitions/name",
                                                                                                },
                                                                                                level24: {
                                                                                                  required: ["name"],
                                                                                                  type: "object",
                                                                                                  properties: {
                                                                                                    name: {
                                                                                                      $ref: "#/definitions/name",
                                                                                                    },
                                                                                                    level25: {
                                                                                                      required: [
                                                                                                        "name",
                                                                                                      ],
                                                                                                      type: "object",
                                                                                                      properties: {
                                                                                                        name: {
                                                                                                          $ref: "#/definitions/name",
                                                                                                        },
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
                                                                                                                                  level30:
                                                                                                                                    {
                                                                                                                                      $ref: "#",
                                                                                                                                    },
                                                                                                                                  name: {
                                                                                                                                    $ref: "#/definitions/name",
                                                                                                                                  },
                                                                                                                                },
                                                                                                                            },
                                                                                                                          name: {
                                                                                                                            $ref: "#/definitions/name",
                                                                                                                          },
                                                                                                                        },
                                                                                                                    },
                                                                                                                  name: {
                                                                                                                    $ref: "#/definitions/name",
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
                                                                                              $ref: "#/definitions/name",
                                                                                            },
                                                                                          },
                                                                                        },
                                                                                        name: {
                                                                                          $ref: "#/definitions/name",
                                                                                        },
                                                                                      },
                                                                                    },
                                                                                    name: {
                                                                                      $ref: "#/definitions/name",
                                                                                    },
                                                                                  },
                                                                                },
                                                                                name: {
                                                                                  $ref: "#/definitions/name",
                                                                                },
                                                                              },
                                                                            },
                                                                            name: {
                                                                              $ref: "#/definitions/name",
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
                                                                name: {
                                                                  $ref: "#/definitions/name",
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
                                                  $ref: "#/definitions/name",
                                                },
                                              },
                                            },
                                            name: {
                                              $ref: "#/definitions/name",
                                            },
                                          },
                                        },
                                        name: {
                                          $ref: "#/definitions/name",
                                        },
                                      },
                                    },
                                    name: {
                                      $ref: "#/definitions/name",
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
                  $ref: "#/definitions/name",
                },
              },
            },
            name: {
              $ref: "#/definitions/name",
            },
          },
        },
        name: {
          $ref: "#/definitions/name",
        },
      },
    },
    name: {
      $ref: "#/definitions/name",
    },
  },
};
