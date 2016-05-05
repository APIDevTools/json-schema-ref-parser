(function() {
  'use strict';

  global.helper = {};

  /**
   * Parsed JSON schemas
   */
  helper.parsed = {};

  /**
   * Dereferenced JSON schemas
   */
  helper.dereferenced = {};

  /**
   * Bundled JSON schemas
   */
  helper.bundled = {};

  /**
   * Throws an error if called.
   */
  helper.shouldNotGetCalled = function shouldNotGetCalled(done) {
    var err = new Error('This function should not have gotten called.');
    if (typeof done === 'function') {
      return function(err2) {
        if (err2 instanceof Error) {
          done(err2);
        }
        else {
          done(err);
        }
      };
    }
    else {
      throw err;
    }
  };

  /**
   * Asserts that all members of an array have all the specified properties and values.
   *
   * @param {array} array - The array to inspect
   * @param {object} props - The properties and values to assert
   */
  helper.expectAll = function expectAll(array, props) {
    var keys = Object.keys(props);
    array.forEach(function(item, index) {
      try {
        var actual = keys.reduce(function(actual, prop) {
          actual[prop] = item[prop];
          return actual;
        }, {});

        expect(actual).to.deep.equal(props);
      }
      catch (e) {
        console.error('\nAssertion failed for item at array index %d\n%s\n', index, item);
        throw e;
      }
    });
  };

  /**
   * Asserts that the given {@link Schema} object is well-formed and complies
   * with all the expectations for a schema object.
   *
   * @param {Schema} schema
   */
  helper.validateSchema = function validateSchema(schema) {
    expect(schema).to.be.an('object').and.ok;
    expect(schema).to.have.property('files').that.is.an('array');
    expect(schema).to.have.property('circular').that.is.a('boolean');
    expect(schema).to.have.property('root');
    expect(schema).to.have.property('rootUrl');
    expect(schema).to.have.property('rootFile');

    if (schema.files.length === 0) {
      expect(schema.root).to.be.null;
      expect(schema.rootUrl).to.be.null;
      expect(schema.rootFile).to.be.null;
    }
    else {
      expect(schema.root).to.be.an('object').and.not.null;
      expect(schema.root).to.equal(schema.files[0].data);
      expect(schema.rootUrl).to.be.a('string').and.not.null;
      expect(schema.rootUrl).to.equal(schema.files[0].url);
      expect(schema.rootFile).to.be.an('object').and.not.null;
      expect(schema.rootFile).to.equal(schema.files[0]);
    }
  };

  /**
   * Asserts that the given {@link File} objects are well-formed and comply
   * with all the expectations for file objects.
   *
   * Also asserts that the array ONLY contains the expected file URLs.
   *
   * @param {FileArray} files
   * @param {string[]}  expectedUrls - An array of file paths
   */
  helper.validateFiles = function validateFiles(files, expectedUrls) {
    expect(files).to.be.an('array');
    files.forEach(helper.validateFile);

    var actualUrls = files.map(function(file) { return file.url; });
    try {
      expect(files).to.have.lengthOf(expectedUrls.length);
      expect(actualUrls).to.have.same.members(expectedUrls);
    }
    catch (e) {
      console.error('\nEXPECTED FILES:\n' + expectedUrls.join('\n'));
      console.error('\nACTUAL FILES:\n' + actualUrls.join('\n') + '\n');
      throw e;
    }
  };

  /**
   * Asserts that the given {@link File} object is well-formed and complies
   * with all the expectations for a file object.
   *
   * @param {File} file
   */
  helper.validateFile = function validateFile(file) {
    expect(file).to.be.an('object').and.ok;
    expect(file).to.have.property('url').that.is.a('string').with.length.above(0);
    expect(file).to.have.property('urlType').that.is.a('string').with.length.above(0);
    expect(file).to.have.property('path').that.is.a('string').with.length.above(0);
    expect(file).to.have.property('extension').that.is.a('string').with.length.above(0);
    expect(file).to.have.property('data');
    expect(file).to.have.property('dataType').that.is.a('string').with.length.above(0);
    expect(file).to.have.property('parsed').that.is.a('boolean');
    expect(file).to.have.property('dereferenced').that.is.a('boolean');

    expect(file.extension).to.match(/^\.[a-z]+/);  // lowercase and start with a dot

    if (userAgent.isBrowser) {
      expect(file.urlType).not.to.equal('file');
    }

    if (file.urlType === 'http') {
      expect(file.url).to.match(/^https?\:\/\//);
      expect(file.path).to.match(/^https?\:\/\//);
    }
    else if (file.urlType === 'file') {
      expect(file.url).to.match(/^[^ \#\?]+$/);       // enocded path (no spaces, hashes, question marks, etc.)
      expect(file.path).to.match(/^(\/|[A-Z]\:\\)/);  // POSIX or Windows path
    }
  };

  // TODO: Remove this function once it's no longer called anywhere
  helper.testResolve = function testResolve(filePath, params) {
    return function(done) {
      done(new Error('helper.testResolve() should not be used anymore'));
    };
  };

  /**
   * Creates a deep clone of the given value.
   */
  helper.cloneDeep = function cloneDeep(value) {
    var clone = value;
    if (value && typeof value === 'object') {
      clone = value instanceof Array ? [] : {};
      var keys = Object.keys(value);
      for (var i = 0; i < keys.length; i++) {
        clone[keys[i]] = helper.cloneDeep(value[keys[i]]);
      }
    }
    return clone;
  };

}());
