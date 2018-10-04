// Mocha configuration
(function () {
  'use strict';

  if (host.browser) {
    mocha.setup('bdd');
    mocha.fullTrace();
    mocha.asyncOnly();
    mocha.checkLeaks();
    mocha.globals(['$0', '$1', '$2', '$3', '$4', '$5']);

    // Output each test's name, for debugging purposes
    beforeEach(function () {
      console.log('START ' + this.currentTest.parent.title + ' - ' + this.currentTest.title);
    });
    afterEach(function () {
      console.log('DONE  ' + this.currentTest.parent.title + ' - ' + this.currentTest.title);
    });
  }

  beforeEach(function () {
    // Flag TravisCI and SauceLabs as being very slow environments
    var isSlowEnvironment = host.env.CI || host.karma;

    // Most of our tests perform multiple AJAX requests,
    // so we need to increase the timeouts to allow for that
    this.currentTest.timeout(isSlowEnvironment ? 10000 : 4000);
    this.currentTest.slow(1000);
  });

}());
