'use strict';

var yaml      = require('js-yaml'),
    util      = require('./util'),
    ono       = require('ono'),
    _isEmpty  = require('lodash/lang/isEmpty'),
    _isString = require('lodash/lang/isString');

module.exports = parse;

/**
 * Parses the given data as YAML, JSON, or a raw Buffer (byte array), depending on the options.
 *
 * @param {string|Buffer} data - The data to be parsed
 * @param {string} path - The file path or URL that `data` came from
 * @param {$RefParserOptions} options
 *
 * @returns {string|Buffer|object}
 * If `data` can be parsed as YAML or JSON, then the returned value is a JavaScript object.
 * Otherwise, the returned value is the raw string or Buffer that was passed in.
 */
function parse(data, path, options) {
  var parsed;

  try {
    if (options.allow.yaml) {
      util.debug('Parsing YAML file: %s', path);
      parsed = yaml.safeLoad(data.toString());
      util.debug('    Parsed successfully');
    }
    else if (options.allow.json) {
      util.debug('Parsing JSON file: %s', path);
      parsed = JSON.parse(data.toString());
      util.debug('    Parsed successfully');
    }
    else {
      parsed = data;
    }
  }
  catch (e) {
    var ext = util.extname(path);
    if (options.allow.unknown && ['.json', '.yaml', '.yml'].indexOf(ext) === -1) {
      // It's not a YAML or JSON file, and unknown formats are allowed,
      // so ignore the parsing error and just return the raw data
      util.debug('    Unknown file format. Not parsed.');
      parsed = data;
    }
    else {
      throw ono.syntax(e, 'Error parsing "%s"', path);
    }
  }

  var empty = _isEmpty(parsed) ||                           // empty objects
    parsed.length === 0 ||                                  // empty Buffers
    (_isString(parsed) && (parsed.trim().length === 0));    // empty strings

  if (empty && !options.allow.empty) {
    throw ono.syntax('Error parsing "%s". \nParsed value is empty', path);
  }

  return parsed;
}
