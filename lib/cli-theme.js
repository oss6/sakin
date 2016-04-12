'use strict';
var chalk = require('chalk');
var utils = require('./utils');

module.exports = {
    task: function (text) {
        return chalk.bold(utils.repeat('=', text.length + 8)) + '\n' +
            chalk.bold('>' + utils.repeat(' ', 3) + text + utils.repeat(' ', 3)) + '<\n' +
            chalk.bold(utils.repeat('=', text.length + 8)) + '\n'
    },
    error: function (text) {
        return chalk.bold.red('✘ ' + text);
    },
    success: function (text) {
        return chalk.bold.green('✓ ') + text;
    }
};
