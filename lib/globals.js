'use strict';
var fs = require('fs');

var x = module.exports;

x.loadSettings = function () {
    return JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
};
