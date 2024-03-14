"use strict";

module.exports = {
  defaultParsers: {
    definitions: {
      markdown: "Hello\nWorld:\n",

      html: '<!doctype html>\n<html lang="en">\n<head>\n    <meta charset="utf-8">\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World: </h1>\n</body>\n</html>\n',

      css: "html {\n  color: #888;\n  font-family: sans-serif;\n  height: 100%;\n  width: 100%;\n}\n",

      unknown: "This is an : unknown : file type",

      empty: undefined
    }
  },

  staticParser: {
    definitions: {
      markdown: "The quick brown fox jumped over the lazy dog",

      html: "The quick brown fox jumped over the lazy dog",

      css: "The quick brown fox jumped over the lazy dog",

      unknown: "The quick brown fox jumped over the lazy dog",

      empty: "The quick brown fox jumped over the lazy dog"
    }
  },

  customParser: {
    definitions: {
      markdown: "Hello\nWorld:\n",

      html: '<!doctype html>\n<html lang="en">\n<head>\n    <meta charset="utf-8">\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World: </h1>\n</body>\n</html>\n',

      css: "html {\n  color: #888;\n  font-family: sans-serif;\n  height: 100%;\n  width: 100%;\n}\n",

      unknown: "epyt elif : nwonknu : na si sihT",

      empty: undefined
    }
  },
};
