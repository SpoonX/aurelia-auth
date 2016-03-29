var path = require('path');
var fs = require('fs');

var appRoot = 'src/';
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
// your main file which exports only configure and other modules.
// usually packageName or 'index.js'
var entryFileName = pkg.name + '.js';

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.js',
  tsSource: [
    appRoot + '**/*.js',          // list files to parse for d.ts
   '!' + appRoot + entryFileName, // exclude entry file
   '!**/authUtils.js'  			  // exclude utility functions
  ],
  html: appRoot + '**/*.html',
  style: 'styles/**/*.css',
  output: 'dist/',
  doc: './doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/',
  packageName: pkg.name
};
