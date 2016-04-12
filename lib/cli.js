#!/usr/bin/env node
'use strict';

var program = require('commander');
var writer = require('./writer');
var generator = require('./generator');
var theme = require('./cli-theme');
var ActionObservable = require('./action-observable');

program
    .version('0.1.0')
    .option('-c, --clear', 'clear working directory')
    .option('-a, --article <title>', 'create an article')
    .option('-p, --page <title>', 'create a page')
    .option('-g, --generate', 'generate the site')
    .parse(process.argv);

// Load action observable
var action = new ActionObservable();

action.on('log', function (type, text) {
    console.log(theme[type](text));
});

if (process.argv.length === 2) {

    console.log(theme.task('Creating site'));
    writer.createProject(action, function (errors) {
        if (errors.length !== 0) {
            console.log(theme.error('An error occurred while creating the site'));
        } else {
            console.log(theme.success('Site created successfully'));
        }
    });

} else if (program.clear) {

    writer.clearWorkspace(action, function (err) {
        if (err) {

        } else {
            console.log(theme.success('Workspace cleared successfully'));
        }
    });

} else if (program.article) {

    writer.createFile(program.article, 'article', function (err) {
        if (err) {
            console.log('Error');
        } else {
            console.log('Success!!!!');
        }
    });

} else if (program.page) {

    console.log(program.page);

} else if (program.generate) {

    console.log(theme.task('Generating site'));
    generator.generate(action, function (errors) {
        if (errors.length !== 0) {
            console.log(errors);
        } else {
            console.log(theme.success('Site generated successfully'));
        }
    });

}
