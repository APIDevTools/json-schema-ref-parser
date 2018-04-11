helper.bundled.complexOrder = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  properties: {
    actions: {
      type: 'object',
      properties: {
        affirmativeAction: {
          type: 'object',
          properties: {
            $id: 'text_assets',
            oneOf: [
              {
                $ref: '#/properties/actions/properties/affirmativeAction/properties/definitions/asset'
              },
              {
                $ref: '#/properties/actions/properties/affirmativeAction/properties/definitions/asset'
              }
            ],
            definitions: {
              switchWrapper: {
                type: 'object',
                $ref: '#/properties/actions/properties/affirmativeAction/properties/definitions/switch'
              },
              asset: {
                type: 'object',
                $id: 'asset_action',
                properties: {
                  label: {
                    $ref: '#/properties/actions/properties/affirmativeAction/properties'
                  }
                }
              },
              switch: {
                type: 'array',
                $ref: '#/properties/actions/properties/affirmativeAction/properties/definitions/asset'
              }
            }
          }
        },
        negativeAction: {
          $ref: '#/properties/actions/properties/affirmativeAction'
        },
        prevAction: {
          $ref: '#/properties/actions/properties/affirmativeAction'
        }
      }
    }
  }
};
