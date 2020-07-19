"use strict";

let name = {
  required: [
    "first",
    "last"
  ],
  type: "object",
  properties: {
    middle: {
      minLength: 1,
      type: "string"
    },
    prefix: {
      minLength: 3,
      type: "string",
      title: "requiredString"
    },
    last: {
      minLength: 1,
      type: "string",
      title: "requiredString"
    },
    suffix: {
      minLength: 3,
      maxLength: 3,
      type: "string",
      title: "requiredString"
    },
    first: {
      minLength: 1,
      type: "string",
      title: "requiredString"
    }
  },
  title: "name"
};

module.exports =
{
  type: "object",
  properties: {
    "level 1": {
      required: [
        "name"
      ],
      type: "object",
      properties: {
        "level 2": {
          required: [
            "name"
          ],
          type: "object",
          properties: {
            "level 3": {
              required: [
                "name"
              ],
              type: "object",
              properties: {
                "level 4": {
                  required: [
                    "name"
                  ],
                  type: "object",
                  properties: {
                    name: {
                      type: name
                    },
                    "level 5": {
                      required: [
                        "name"
                      ],
                      type: "object",
                      properties: {
                        name: {
                          type: name
                        },
                        "level 6": {
                          required: [
                            "name"
                          ],
                          type: "object",
                          properties: {
                            name: {
                              type: name
                            },
                            "level 7": {
                              required: [
                                "name"
                              ],
                              type: "object",
                              properties: {
                                "level 8": {
                                  required: [
                                    "name"
                                  ],
                                  type: "object",
                                  properties: {
                                    "level 9": {
                                      required: [
                                        "name"
                                      ],
                                      type: "object",
                                      properties: {
                                        "level 10": {
                                          required: [
                                            "name"
                                          ],
                                          type: "object",
                                          properties: {
                                            "level 11": {
                                              required: [
                                                "name"
                                              ],
                                              type: "object",
                                              properties: {
                                                "level 12": {
                                                  required: [
                                                    "name"
                                                  ],
                                                  type: "object",
                                                  properties: {
                                                    "level 13": {
                                                      required: [
                                                        "name"
                                                      ],
                                                      type: "object",
                                                      properties: {
                                                        name: {
                                                          type: name
                                                        },
                                                        "level 14": {
                                                          required: [
                                                            "name"
                                                          ],
                                                          type: "object",
                                                          properties: {
                                                            name: {
                                                              type: name
                                                            },
                                                            "level 15": {
                                                              required: [
                                                                "name"
                                                              ],
                                                              type: "object",
                                                              properties: {
                                                                "level 16": {
                                                                  required: [
                                                                    "name"
                                                                  ],
                                                                  type: "object",
                                                                  properties: {
                                                                    name: {
                                                                      type: name
                                                                    },
                                                                    "level 17": {
                                                                      required: [
                                                                        "name"
                                                                      ],
                                                                      type: "object",
                                                                      properties: {
                                                                        "level 18": {
                                                                          required: [
                                                                            "name"
                                                                          ],
                                                                          type: "object",
                                                                          properties: {
                                                                            "level 19": {
                                                                              required: [
                                                                                "name"
                                                                              ],
                                                                              type: "object",
                                                                              properties: {
                                                                                "level 20": {
                                                                                  required: [
                                                                                    "name"
                                                                                  ],
                                                                                  type: "object",
                                                                                  properties: {
                                                                                    "level 21": {
                                                                                      required: [
                                                                                        "name"
                                                                                      ],
                                                                                      type: "object",
                                                                                      properties: {
                                                                                        "level 22": {
                                                                                          required: [
                                                                                            "name"
                                                                                          ],
                                                                                          type: "object",
                                                                                          properties: {
                                                                                            "level 23": {
                                                                                              required: [
                                                                                                "name"
                                                                                              ],
                                                                                              type: "object",
                                                                                              properties: {
                                                                                                name: {
                                                                                                  type: name
                                                                                                },
                                                                                                "level 24": {
                                                                                                  required: [
                                                                                                    "name"
                                                                                                  ],
                                                                                                  type: "object",
                                                                                                  properties: {
                                                                                                    name: {
                                                                                                      type: name
                                                                                                    },
                                                                                                    "level 25": {
                                                                                                      required: [
                                                                                                        "name"
                                                                                                      ],
                                                                                                      type: "object",
                                                                                                      properties: {
                                                                                                        name: {
                                                                                                          type: name
                                                                                                        },
                                                                                                        "level 26": {
                                                                                                          required: [
                                                                                                            "name"
                                                                                                          ],
                                                                                                          type: "object",
                                                                                                          properties: {
                                                                                                            "level 27": {
                                                                                                              required: [
                                                                                                                "name"
                                                                                                              ],
                                                                                                              type: "object",
                                                                                                              properties: {
                                                                                                                "level 28": {
                                                                                                                  required: [
                                                                                                                    "name"
                                                                                                                  ],
                                                                                                                  type: "object",
                                                                                                                  properties: {
                                                                                                                    "level 29": {
                                                                                                                      required: [
                                                                                                                        "name"
                                                                                                                      ],
                                                                                                                      type: "object",
                                                                                                                      properties: {
                                                                                                                        name: {
                                                                                                                          type: name
                                                                                                                        }
                                                                                                                      }
                                                                                                                    },
                                                                                                                    name: {
                                                                                                                      type: name
                                                                                                                    }
                                                                                                                  }
                                                                                                                },
                                                                                                                name: {
                                                                                                                  type: name
                                                                                                                }
                                                                                                              }
                                                                                                            },
                                                                                                            name: {
                                                                                                              type: name
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            },
                                                                                            name: {
                                                                                              type: name
                                                                                            }
                                                                                          }
                                                                                        },
                                                                                        name: {
                                                                                          type: name
                                                                                        }
                                                                                      }
                                                                                    },
                                                                                    name: {
                                                                                      type: name
                                                                                    }
                                                                                  }
                                                                                },
                                                                                name: {
                                                                                  type: name
                                                                                }
                                                                              }
                                                                            },
                                                                            name: {
                                                                              type: name
                                                                            }
                                                                          }
                                                                        },
                                                                        name: {
                                                                          type: name
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                },
                                                                name: {
                                                                  type: name
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    },
                                                    name: {
                                                      type: name
                                                    }
                                                  }
                                                },
                                                name: {
                                                  type: name
                                                }
                                              }
                                            },
                                            name: {
                                              type: name
                                            }
                                          }
                                        },
                                        name: {
                                          type: name
                                        }
                                      }
                                    },
                                    name: {
                                      type: name
                                    }
                                  }
                                },
                                name: {
                                  type: name
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                name: {
                  type: name
                }
              }
            },
            name: {
              type: name
            }
          }
        },
        name: {
          type: name
        }
      }
    },
    name: {
      type: name
    }
  },
  title: "Deep Schema"
};
