#!/usr/bin/env node
'use strict';

var program = require('commander');
var writer = require('./writer');

program
    .version('0.1.0')
    //.usage('[options] <file ...>')
    .option('-c, --clear', 'clear working directory')
    .option('-a, --article <title>', 'create an article')
    .option('-p, --page <title>', 'create a page')
    .parse(process.argv);

if (process.argv.length === 2) {

    console.log("Create project");

    writer.createProject(function () {
        console.log("Created!");
    });

} else if (program.clear) {

    writer.clearWorkspace(function () {
        console.log("Cleared!");
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

}
