export default {
  schema: {
    definitions: {
      markdown: {
        $ref: "files/README.md",
      },
      html: {
        $ref: "files/page.html",
      },
      css: {
        $ref: "files/style.css",
      },
      binary: {
        $ref: "files/binary.png",
      },
      unknown: {
        $ref: "files/unknown.foo",
      },
      empty: {
        $ref: "files/empty",
      },
    },
  },
};
