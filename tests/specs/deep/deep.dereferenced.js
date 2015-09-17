(function() {
  'use strict';

  var name = {
    "required": [
      "first",
      "last"
    ],
    "type": "object",
    "properties": {
      "middle": {
        "minLength": 1,
        "type": "string"
      },
      "prefix": {
        "minLength": 3,
        "type": "string",
        "title": "requiredString"
      },
      "last": {
        "minLength": 1,
        "type": "string",
        "title": "requiredString"
      },
      "suffix": {
        "minLength": 3,
        "maxLength": 3,
        "type": "string",
        "title": "requiredString"
      },
      "first": {
        "minLength": 1,
        "type": "string",
        "title": "requiredString"
      }
    },
    "title": "name"
  };

  helper.dereferenced.deep =
  {
    "type": "object",
    "properties": {
      "level1": {
        "required": [
          "name"
        ],
        "type": "object",
        "properties": {
          "level2": {
            "required": [
              "name"
            ],
            "type": "object",
            "properties": {
              "level3": {
                "required": [
                  "name"
                ],
                "type": "object",
                "properties": {
                  "level4": {
                    "required": [
                      "name"
                    ],
                    "type": "object",
                    "properties": {
                      "name": {
                        "type": name
                      },
                      "level5": {
                        "required": [
                          "name"
                        ],
                        "type": "object",
                        "properties": {
                          "name": {
                            "type": name
                          },
                          "level6": {
                            "required": [
                              "name"
                            ],
                            "type": "object",
                            "properties": {
                              "name": {
                                "type": name
                              },
                              "level7": {
                                "required": [
                                  "name"
                                ],
                                "type": "object",
                                "properties": {
                                  "level8": {
                                    "required": [
                                      "name"
                                    ],
                                    "type": "object",
                                    "properties": {
                                      "level9": {
                                        "required": [
                                          "name"
                                        ],
                                        "type": "object",
                                        "properties": {
                                          "level10": {
                                            "required": [
                                              "name"
                                            ],
                                            "type": "object",
                                            "properties": {
                                              "level11": {
                                                "required": [
                                                  "name"
                                                ],
                                                "type": "object",
                                                "properties": {
                                                  "level12": {
                                                    "required": [
                                                      "name"
                                                    ],
                                                    "type": "object",
                                                    "properties": {
                                                      "level13": {
                                                        "required": [
                                                          "name"
                                                        ],
                                                        "type": "object",
                                                        "properties": {
                                                          "name": {
                                                            "type": name
                                                          },
                                                          "level14": {
                                                            "required": [
                                                              "name"
                                                            ],
                                                            "type": "object",
                                                            "properties": {
                                                              "name": {
                                                                "type": name
                                                              },
                                                              "level15": {
                                                                "required": [
                                                                  "name"
                                                                ],
                                                                "type": "object",
                                                                "properties": {
                                                                  "level16": {
                                                                    "required": [
                                                                      "name"
                                                                    ],
                                                                    "type": "object",
                                                                    "properties": {
                                                                      "name": {
                                                                        "type": name
                                                                      },
                                                                      "level17": {
                                                                        "required": [
                                                                          "name"
                                                                        ],
                                                                        "type": "object",
                                                                        "properties": {
                                                                          "level18": {
                                                                            "required": [
                                                                              "name"
                                                                            ],
                                                                            "type": "object",
                                                                            "properties": {
                                                                              "level19": {
                                                                                "required": [
                                                                                  "name"
                                                                                ],
                                                                                "type": "object",
                                                                                "properties": {
                                                                                  "level20": {
                                                                                    "required": [
                                                                                      "name"
                                                                                    ],
                                                                                    "type": "object",
                                                                                    "properties": {
                                                                                      "level21": {
                                                                                        "required": [
                                                                                          "name"
                                                                                        ],
                                                                                        "type": "object",
                                                                                        "properties": {
                                                                                          "level22": {
                                                                                            "required": [
                                                                                              "name"
                                                                                            ],
                                                                                            "type": "object",
                                                                                            "properties": {
                                                                                              "level23": {
                                                                                                "required": [
                                                                                                  "name"
                                                                                                ],
                                                                                                "type": "object",
                                                                                                "properties": {
                                                                                                  "name": {
                                                                                                    "type": name
                                                                                                  },
                                                                                                  "level24": {
                                                                                                    "required": [
                                                                                                      "name"
                                                                                                    ],
                                                                                                    "type": "object",
                                                                                                    "properties": {
                                                                                                      "name": {
                                                                                                        "type": name
                                                                                                      },
                                                                                                      "level25": {
                                                                                                        "required": [
                                                                                                          "name"
                                                                                                        ],
                                                                                                        "type": "object",
                                                                                                        "properties": {
                                                                                                          "name": {
                                                                                                            "type": name
                                                                                                          },
                                                                                                          "level26": {
                                                                                                            "required": [
                                                                                                              "name"
                                                                                                            ],
                                                                                                            "type": "object",
                                                                                                            "properties": {
                                                                                                              "level27": {
                                                                                                                "required": [
                                                                                                                  "name"
                                                                                                                ],
                                                                                                                "type": "object",
                                                                                                                "properties": {
                                                                                                                  "level28": {
                                                                                                                    "required": [
                                                                                                                      "name"
                                                                                                                    ],
                                                                                                                    "type": "object",
                                                                                                                    "properties": {
                                                                                                                      "level29": {
                                                                                                                        "required": [
                                                                                                                          "name"
                                                                                                                        ],
                                                                                                                        "type": "object",
                                                                                                                        "properties": {
                                                                                                                          "name": {
                                                                                                                            "type": name
                                                                                                                          }
                                                                                                                        }
                                                                                                                      },
                                                                                                                      "name": {
                                                                                                                        "type": name
                                                                                                                      }
                                                                                                                    }
                                                                                                                  },
                                                                                                                  "name": {
                                                                                                                    "type": name
                                                                                                                  }
                                                                                                                }
                                                                                                              },
                                                                                                              "name": {
                                                                                                                "type": name
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              },
                                                                                              "name": {
                                                                                                "type": name
                                                                                              }
                                                                                            }
                                                                                          },
                                                                                          "name": {
                                                                                            "type": name
                                                                                          }
                                                                                        }
                                                                                      },
                                                                                      "name": {
                                                                                        "type": name
                                                                                      }
                                                                                    }
                                                                                  },
                                                                                  "name": {
                                                                                    "type": name
                                                                                  }
                                                                                }
                                                                              },
                                                                              "name": {
                                                                                "type": name
                                                                              }
                                                                            }
                                                                          },
                                                                          "name": {
                                                                            "type": name
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  },
                                                                  "name": {
                                                                    "type": name
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      },
                                                      "name": {
                                                        "type": name
                                                      }
                                                    }
                                                  },
                                                  "name": {
                                                    "type": name
                                                  }
                                                }
                                              },
                                              "name": {
                                                "type": name
                                              }
                                            }
                                          },
                                          "name": {
                                            "type": name
                                          }
                                        }
                                      },
                                      "name": {
                                        "type": name
                                      }
                                    }
                                  },
                                  "name": {
                                    "type": name
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  "name": {
                    "type": name
                  }
                }
              },
              "name": {
                "type": name
              }
            }
          },
          "name": {
            "type": name
          }
        }
      },
      "name": {
        "type": name
      }
    },
    "title": "Deep Schema"
  };

})();
