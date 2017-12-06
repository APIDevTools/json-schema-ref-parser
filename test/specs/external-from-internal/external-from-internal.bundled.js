helper.bundled.externalFromInternal = {
  paths: {
    $ref: '#/components'
  },
  external: {
    go: {
      deeper: {
        $ref: '#/components/test'
      }
    }
  },
  components: {
    test: {
      type: 'string'
    }
  }
};
