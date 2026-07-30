export default {
  $schema: "http://json-schema.org/draft-07/schema#",
  properties: {
    actions: {
      type: "object",
      properties: {
        affirmativeAction: {
          $ref: "#/properties/actions/properties/prevAction",
        },
        negativeAction: {
          $ref: "#/properties/actions/properties/prevAction",
        },
        prevAction: {
          type: "object",
          properties: {
            $id: "text_assets",
            oneOf: [
              {
                $ref: "#/definitions/asset",
              },
              {
                $ref: "#/definitions/asset",
              },
            ],
            definitions: {
              switchWrapper: {
                type: "object",
                $ref: "#/definitions/switch",
              },
              asset: {
                type: "object",
                $id: "asset_action",
                properties: {
                  label: {
                    $ref: "text_assets",
                  },
                },
              },
              switch: {
                type: "array",
                $ref: "#/definitions/asset",
              },
            },
          },
        },
      },
    },
  },
};
