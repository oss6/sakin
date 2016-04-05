'use strict';
var fs = require('fs');

var x = module.exports;

x.loadSettings = function () {
    x.settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
};

x.settings = {};
