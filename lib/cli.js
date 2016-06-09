#!/usr/bin/env node
'use strict';

var fs = require('fs-extra');
var utils = require('./utils');
var writer = require('./writer');
var program = require('commander');
var theme = require('./cli-theme');
var generator = require('./generator');
var createServer = require('./server');
var publisher = require('./publisher');
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

// Load settings
// ==============================================

var settings;
try {
    settings = utils.loadSettings();
} catch (e) {
    settings = {
        error: e.message
    };
}

// Load action observable
// ==============================================

var action = new ActionObservable(false);

action.on('log', function (type, text) {
    console.log(theme[type](text));
});

var smartGeneration = utils.chooseOption(
    program.enableSmart,
    program.disableSmart,
    settings['smart_generation']
);

// Create site
// ==============================================

if (program.init) {

    console.log(theme.task('Creating site'));
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
    fs.stat('.sakin', err => {
        if (err && err.code === 'ENOENT') {
            log(theme.error('Not a sakin workspace. Type \'sakin -i\' to create a site.'));
            exit(1);
        }
    });
}

// Option processing
// ==============================================

if (program.clear) {

    log(theme.task('Clearing workspace'));

    writer.clearWorkspace(
        action,
        errors => {
            log(errors.length !== 0
                ? theme.error('An error occurred while clearing the workspace')
                : theme.success('Workspace cleared successfully')
            );
        }
    );

} else if (program.article || program.page) {

    var type = program.article ? 'article' : 'page';
    var name = program.article ? program.article : program.page;

    writer.createFile(
        name,
        type,
        err => {
            log(err
                ? theme.error(`Could not create the ${type}`)
                : theme.success(`${utils.titleCase(type)} created successfully`)
            );
        }
    );

} else if (program.generate) {

    log(theme.task('Generating site'));

    generator.generate(
        action,
        smartGeneration,
        errors => {
            log(errors.length !== 0
                ? theme.error('Could not generate the site')
                : theme.success('Site generated successfully')
            );
        }
    );

} else if (program.serve) {

    var port = typeof program.serve === 'boolean' ? '8000' : program.serve;
    var server = createServer('output');
    var watcher = generator.watchChanges(action, 'contents');

    process.on('SIGINT', () => {
        watcher.close();
        process.exit();
    });

    log(theme.task('Previewing site at localhost:' + port));

    server.listen(Number(port));

} else if (program.publish) {

    publisher.publish(settings.publish, error => {
        if (error !== null) {
            console.log(theme.error(error));
        }
    });

} else if (program.menu) {

    log(theme.task('This feature is not yet supported'));
    // writer.createMenu();

}
