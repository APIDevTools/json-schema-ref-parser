"use strict";

module.exports =
{
  schema: {
    definitions: {
      name: {
        title: "name",
        required: [
          "first",
          "last"
        ],
        type: "object",
        properties: {
          last: {
            $ref: "#/definitions/name/properties/first"
          },
          first: {
            type: "string"
          }
        },
      }
    },
    $ref: "#/definitions/name"
  }
};
