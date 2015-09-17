helper.bundled.circularExternal =
{
  "definitions": {
    "thing": {
      "$ref": "#/definitions/thing"
    },
    "person": {
      "title": "person",
      "type": "object",
      "properties": {
        "spouse": {
          "type": {
            "$ref": "#/definitions/person"
          }
        },
        "name": {
          "type": "string"
        }
      }
    },
    "parent": {
      "title": "parent",
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "children": {
          "items": {
            "$ref": "#/definitions/child"
          },
          "type": "array"
        }
      }
    },
    "child": {
      "title": "child",
      "type": "object",
      "properties": {
        "parents": {
          "items": {
            "$ref": "#/definitions/parent"
          },
          "type": "array"
        },
        "name": {
          "type": "string"
        }
      }
    }
  }
};
