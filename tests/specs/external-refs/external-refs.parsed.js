helper.parsed.externalRefs =
{
  "definitions": {
    "$ref": "definitions/definitions.json"
  },
  "required": [
    "name"
  ],
  "type": "object",
  "properties": {
    "gender": {
      "enum": [
        "male",
        "female"
      ],
      "type": "string"
    },
    "age": {
      "minimum": 0,
      "type": "integer"
    },
    "name": {
      "$ref": "#/definitions/name"
    }
  },
  "title": "Person"
};
