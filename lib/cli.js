#!/usr/bin/env node
'use strict';

var program = require('commander');
var writer = require('./writer');
var generator = require('./generator');
var theme = require('./cli-theme');

program
    .version('0.1.0')
    .option('-c, --clear', 'clear working directory')
    .option('-a, --article <title>', 'create an article')
    .option('-p, --page <title>', 'create a page')
    .option('-g, --generate', 'generate the site')
    .parse(process.argv);

if (process.argv.length === 2) {

    var tasks = theme.tasks('Creating project\n');

    writer.createProject(function (err) {
        if (err) {
            console.log('Errooooor');
            tasks.stop();
        } else {
            console.log(theme.done('Project created successfully'));
            tasks.stop();
        }
    });

} else if (program.clear) {

    writer.clearWorkspace(function (err) {
        if (err) {

        } else {
            console.log("Cleared!");
        }
    });

} else if (program.article) {

    writer.createFile(program.article, 'article', function (err) {
        if (err) {
            console.log("Errooooor!!!");
        } else {
            console.log('Success!!!!');
        }
    });

} else if (program.page) {

    console.log(program.page);

} else if (program.generate) {

    generator.generate(function (errors) {
        
    });

}
