helper.parsed.expand =
{
  "title": "Person",
  "type": "object",
  "properties": {
    "demographics": {
      "type": "object",
      "allOf": [
        {
          "properties": {
            "name": {
              "type": "string"
            }
          },
          "required": [
            "name"
          ]
        },
        {
          "properties": {
            "gender": {
              "type": "string"
            }
          },
          "required": [
            "gender"
          ]
        }
      ]
    }
  }
};
