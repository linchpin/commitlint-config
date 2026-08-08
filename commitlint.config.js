'use strict';

// This repo lints its own commits with the config it publishes, so a change that breaks
// the rules fails here before it reaches every project that extends this package.
// Consumers extend the package name instead — see the README.
module.exports = require('./index.js');
