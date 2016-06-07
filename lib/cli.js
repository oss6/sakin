#!/usr/bin/env node
'use strict';

var fs = require('fs-extra');
var program = require('commander');
var utils = require('./utils');
var writer = require('./writer');
var generator = require('./generator');
var theme = require('./cli-theme');
var createServer = require('./server');
var publisher = require('./publisher');
var ActionObservable = require('./action-observable');

program
    .version('0.1.0')
    .option('-m, --smart-generation', 'activate smart generation')
    .option('-c, --clear', 'clear working directory')
    .option('-a, --article <title>', 'create an article')
    .option('-p, --page <title>', 'create a page')
    .option('-g, --generate', 'generate the website')
    .option('-s, --serve [port]', 'preview the website')
    .option('-P, --publish', 'publish website')
    .option('-n, --menu', 'add/update the website\'s menu')
    .parse(process.argv);

// Load settings
var settings;
try {
    settings = utils.loadSettings();
} catch (e) {
    settings = {
        error: e.message
    };
}

// Load action observable
var action = new ActionObservable(false);

action.on('log', function (type, text) {
    console.log(theme[type](text));
});

var smartGeneration = program.smartGeneration === undefined ? settings['smart_generation'] : program.smartGeneration;

// Create site
// -----------
if (process.argv.length === 2) {

    console.log(theme.task('Creating site'));
    writer.createProject(action, function (errors) {
        if (errors.length !== 0) {
            console.log(theme.error('An error occurred while creating the site'));
            process.exit(1);
        } else {
            console.log(theme.success('Site created successfully'));
            process.exit(0);
        }
    });

} else {
    fs.stat('.sakin', function (err) {
        if (err && err.code === 'ENOENT') {
            console.log(theme.error('Not a sakin workspace. Type \'sakin\' to create a site.'));
            process.exit(1);
        }
    });
}

// Option processing
// -----------------
if (program.clear) {

    console.log(theme.task('Clearing workspace'));
    writer.clearWorkspace(action, function (errors) {
        if (errors.length !== 0) {
            console.log(theme.error('An error occurred while clearing the workspace'));
        } else {
            console.log(theme.success('Workspace cleared successfully'));
        }
    });

} else if (program.article) {

    writer.createFile(program.article, 'article', function (err) {
        if (err) {
            console.log(theme.error('Could not create the article'));
        } else {
            console.log(theme.success('Article created successfully'));
        }
    });

} else if (program.page) {

    writer.createFile(program.page, 'page', function (err) {
        if (err) {
            console.log(theme.error('Could not create the page'));
        } else {
            console.log(theme.success('Page created successfully'));
        }
    });

} else if (program.generate) {

    console.log(theme.task('Generating site'));
    generator.generate(action, smartGeneration, function (errors) {
        if (errors.length !== 0) {
            console.log(theme.error('Could not generate the site'));
        } else {
            console.log(theme.success('Site generated successfully'));
        }
    });

} else if (program.serve) {

    var port = typeof program.serve === 'boolean' ? '8000' : program.serve;
    var server = createServer('output');
    var watcher = generator.watchChanges(action, 'contents');

    process.on('SIGINT', function () {
        watcher.close();
        process.exit();
    });

    console.log(theme.task('Previewing site at localhost:' + port));

    server.listen(Number(port));

} else if (program.publish) {

    publisher.publish(settings.publish, function (error) {
        if (error !== null) {
            console.log(theme.error(error));
        }
    });

} else if (program.menu) {

    console.log(theme.task('This feature is not yet supported'));
    // writer.createMenu();

}
