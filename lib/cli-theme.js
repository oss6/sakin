'use strict';
var chalk = require('chalk');
var ora = require('ora');

module.exports = {
    error: chalk.bold.red,
    tasks: function (text) {
        var spinner = ora(text);
        spinner.start();
        return spinner;
    },
    done: function (text) {
        return chalk.bold.green('✓ ' + text);
    }
};
