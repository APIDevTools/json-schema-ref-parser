// Mocha configuration
(function () {
  "use strict";

  if (host.browser) {
    mocha.setup("bdd");
    mocha.fullTrace();
    mocha.asyncOnly();
    mocha.checkLeaks();
    mocha.globals(["$0", "$1", "$2", "$3", "$4", "$5"]);
  }

  beforeEach(function () {
    // Flag TravisCI and SauceLabs as being very slow environments
    var isSlowEnvironment = host.env.CI || host.karma;

    // Most of our tests perform multiple AJAX requests,
    // so we need to increase the timeouts to allow for that
    this.currentTest.timeout(isSlowEnvironment ? 20000 : 4000);
    this.currentTest.slow(1000);
  });

}());
