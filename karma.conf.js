module.exports = function (karma) {
  karma.set({
    basePath: './',
    frameworks: ['mocha'],
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'node_modules/chai/chai.js',
      'node_modules/chai-as-promised/lib/chai-as-promised.js',
      'cs-cancellable.min.js',
      'tests/unit/*.js'
    ],
    exclude: [
      'karma.conf.js'
    ],
    reporters: ['progress'],
    browsers: ['PhantomJS'],
    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-mocha'
    ],
    autoWatch: true,
    port: 9876
  })
}
