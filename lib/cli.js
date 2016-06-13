#!/usr/bin/env node
'use strict';

var fs = require('fs-extra');
var tasks = require('./tasks');
var writer = require('./writer');
var program = require('commander');
var theme = require('./cli-theme');
var ActionObservable = require('./action-observable');

// ..............................................
// :  cli.js
// :
// :  It is sakin's entry point. It defines
// :  all the options used and delegates
// :  the work to the appropriate
// :  modules.
// ..............................................

// Define command line options
// ==============================================

const log = console.log;
const exit = process.exit;

program
    .version('0.1.0')
    .option('-i, --init', 'initialize website')
    .option('-m, --enable-smart', 'enable smart generation')
    .option('-M, --disable-smart', 'disable smart generation')
    .option('-t, --theme <theme>', 'which theme to use (default)')
    .option('-c, --clear', 'clear working directory')
    .option('-a, --article <title>', 'create an article')
    .option('-p, --page <title>', 'create a page')
    .option('-g, --generate', 'generate the website')
    .option('-s, --serve [port]', 'preview the website')
    .option('-P, --publish', 'publish website')
    .option('-n, --menu', 'add/update the website\'s menu')
    .parse(process.argv);

// Load action observable
// ==============================================

var action = new ActionObservable(false);

action.on('log', function (type, text) {
    log(theme[type](text));
});

// Create site
// ==============================================

if (program.init) {

    log(theme.task('Creating site'));
    writer.createProject(action, { theme: program.theme || 'default' }, errors => {
        if (errors.length !== 0) {
            log(theme.error('An error occurred while creating the site'));
            exit(1);
        } else {
            log(theme.success('Site created successfully'));
            exit(0);
        }
    });

} else {
    // TODO: async problem
    fs.stat('.sakin', err => {
        if (err && err.code === 'ENOENT') {
            log(theme.error('Not a sakin workspace. Type \'sakin -i\' to create a site.'));
            exit(1);
        }

        tasks.run(program);
    });
}
