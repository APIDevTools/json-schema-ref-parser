"use strict";

module.exports =
{
  schema: {
    $ref: "definitions.yaml#/external1",
    external2: {
      $ref: "definitions-other.yaml#/external2"
    },
  },
  
  definitions: {
    external1: {
      thing: {
        type: "string"
      }
    }
  },

  definitionsOther: {
    external2: {
      thing: {
        type: "string"
      }
    }
  }
};
