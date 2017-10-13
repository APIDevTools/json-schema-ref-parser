helper.dereferenced.circularExternal =
{
  definitions: {
    pet: {
      title: 'pet',
      type: 'object',
      properties: {
        age: {
          type: 'number'
        },
        name: {
          type: 'string'
        },
        species: {
          enum: [
            'cat',
            'dog',
            'bird',
            'fish'
          ],
          type: 'string'
        }
      },
    },
    thing: {
      $ref: '#/definitions/thing'
    },
    person: {
      title: 'person',
      type: 'object',
      properties: {
        spouse: null,
        name: {
          type: 'string'
        }
      }
    },
    parent: {
      title: 'parent',
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        children: {
          items: null,
          type: 'array'
        }
      }
    },
    child: {
      title: 'child',
      type: 'object',
      properties: {
        parents: {
          items: null,
          type: 'array'
        },
        name: {
          type: 'string'
        }
      }
    }
  }
};

helper.dereferenced.circularExternal.definitions.person.properties.spouse = helper.dereferenced.circularExternal.definitions.person;
helper.dereferenced.circularExternal.definitions.parent.properties.children.items = helper.dereferenced.circularExternal.definitions.child;
helper.dereferenced.circularExternal.definitions.child.properties.parents.items = helper.dereferenced.circularExternal.definitions.parent;
