helper.bundled.externalPartial =
{
  title: 'Person',
  type: 'object',
  required: [
    'name'
  ],
  properties: {
    name: {
      title: 'name',
      type: 'object',
      required: [
        'first',
        'last'
      ],
      properties: {
        first: {
          title: 'required string',
          type: 'string',
          minLength: 1
        },
        last: {
          $ref: '#/properties/name/properties/first'
        },
        middle: {
          type: {
            $ref: '#/properties/name/properties/first/type'
          },
          minLength: {
            $ref: '#/properties/name/properties/first/minLength'
          }
        },
        prefix: {
          $ref: '#/properties/name/properties/first',
          minLength: 3
        },
        suffix: {
          $ref: '#/properties/name/properties/prefix',
          type: 'string',
          maxLength: 3
        }
      }
    },
    age: {
      type: 'integer',
      minimum: 0
    },
    gender: {
      type: 'string',
      enum: [
        'male',
        'female'
      ]
    }
  }
};
