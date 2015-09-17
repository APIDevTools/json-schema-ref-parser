helper.parsed.circular =
{
  "definitions": {
    "thing": {
      "$ref": "#/definitions/thing"
    },
    "person": {
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
