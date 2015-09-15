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
   * Returns a function that throws an error if called.
   *
   * @param {function} done
   */
  helper.shouldNotGetCalled = function shouldNotGetCalled(done) {
    return function shouldNotGetCalledFN(err) {
      if (!(err instanceof Error)) {
        err = new Error('This function should not have gotten called.');
      }
      done(err);
    };
  };

})();
