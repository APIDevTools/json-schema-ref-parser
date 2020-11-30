"use strict";

const { basename, join, stripRoot, dirname, extname } = require("@stoplight/path");
const {
  getDefaultsForOldJsonSchema,
  getDefaultsForOAS2,
  getDefaultsForOAS3,
} = require("./defaults");
const url = require("../util/url");

function includeMidInFilePath (filepath, mid) {
  if (!mid) {
    return filepath;
  }

  let ext = extname(filepath);
  return join(dirname(filepath), basename(filepath, ext) + `.mid${mid}${ext || ".mid"}`);
}

module.exports = function (cwd, endpointUrl, srn) {
  const opts = {
    preprocessFilepath (file) {
      if (url.isHttp(file)) {
        try {
          const { href, query } = url.parse(file, true);
          if (typeof query.srn === "string") {
            // this is for v1
            return includeMidInFilePath(query.srn, query.mid);
          }

          if (href.indexOf(endpointUrl) === 0) {
            // this is for v2
            return includeMidInFilePath(href.slice(endpointUrl.length), query.mid);
          }
        }
        catch {
          return file;
        }
      }
      else if (srn !== null && url.isFileSystemPath(file) && file.indexOf(cwd) === 0) {
        // filesystem, file in the same project
        return join(srn, stripRoot(file.slice(cwd.length)));
      }


      return file;
    }
  };


  return {
    get oas2 () {
      return getDefaultsForOAS2(opts);
    },
    get oas3 () {
      return getDefaultsForOAS3(opts);
    },
    // eslint-disable-next-line camelcase
    get json_schema () {
      return getDefaultsForOldJsonSchema(opts);
    },
  };
};
