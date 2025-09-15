// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage'),
      reports: ['lcovonly'],
      fixWebpackSourcePaths: true
    },
    // Minimal output in CI
    reporters: ['dots', 'coverage-istanbul'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    // Define a CI-friendly ChromeHeadless launcher
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-software-rasterizer',
          '--headless'
        ]
      }
    },
    browsers: ['ChromeHeadlessCI'],
    // Increase timeouts to avoid disconnections in CI
    browserNoActivityTimeout: 600000,
    browserDisconnectTimeout: 600000,
    browserDisconnectTolerance: 3,
    captureTimeout: 600000,
    concurrency: 1,
    singleRun: true,
    restartOnFileChange: false
  });
};

