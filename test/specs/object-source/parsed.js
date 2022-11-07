import { rel } from "../../utils/path";

export const schema = {
  definitions: {
    // Because we're not specifying a path, the current directory (the "test" directory)
    // will be assumed. So this path must be relative to the "test" directory.
    $ref: rel("specs/object-source/definitions/definitions.json")
  },
  required: [
    "name"
  ],
  type: "object",
  properties: {
    gender: {
      enum: [
        "male",
        "female"
      ],
      type: "string"
    },
    age: {
      minimum: 0,
      type: "integer"
    },
    name: {
      $ref: "#/definitions/name"
    }
  },
  title: "Person"
};
export const definitions = {
  requiredString: {
    $ref: "required-string.yaml"
  },
  string: {
    $ref: "#/requiredString/type"
  },
  name: {
    $ref: "../definitions/name.yaml"
  }
};
export const name = {
  required: [
    "first",
    "last"
  ],
  type: "object",
  properties: {
    middle: {
      minLength: {
        $ref: "#/properties/first/minLength"
      },
      type: {
        $ref: "#/properties/first/type"
      }
    },
    prefix: {
      minLength: 3,
      $ref: "#/properties/last"
    },
    last: {
      $ref: "./required-string.yaml"
    },
    suffix: {
      $ref: "#/properties/prefix",
      type: "string",
      maxLength: 3
    },
    first: {
      $ref: "../definitions/definitions.json#/requiredString"
    }
  },
  title: "name"
};
export const requiredString = {
  minLength: 1,
  type: "string",
  title: "requiredString"
};
