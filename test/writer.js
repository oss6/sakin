'use strict';
var assert = require('assert');
var fs = require('fs-extra');
var path = require('path');
var a = require('async');
var writer = require('../lib/writer');
var ActionObservable = require('../lib/action-observable');

describe('writer', function () {

    var paths = [
        '.sakin',
        'settings.json',
        'static',
        'templates',
        'contents'
    ];

    var checkExistence = function (checkExists, ps, cb) {
        a.each(ps, function (p, next) {
            fs.stat(p, function (err) {
                if (err === null) {
                    assert(checkExists, !checkExists ? 'The file should not exist' : '');
                } else if (err.code === 'ENOENT') {
                    assert(!checkExists, checkExists ? 'The file should exist' : '');
                }

                next();
            });
        }, function () {
            cb();
        });
    };

    var action = new ActionObservable(true);

    /*after(function (done) {
        writer.clearWorkspace(action, function () {
            done();
        });
    });*/

    it('should create all the necessary files', function (done) {
        writer.createProject(action, function () {
            checkExistence(true, paths, done);
        });
    });

    it('should create the output files as defined in the parameter', function (done) {
        var files = [
            {path: path.join('output', 'about.html'), content: '<h1>Hello</h1>'},
            {path: path.join('output', 'contacts.html'), content: '<h1>How are you?</h1>'}
        ];

        var ps = files.map(function (file) {
            return file.path;
        });

        // Create files
        a.each(files, function (file, cb) {
            fs.outputFile(file.path, file.content, cb);
        }, function () {
            writer.saveToOutput(action, files, function () {
                checkExistence(true, ps, done);
            });
        });
    });

    it('should create the example files created at the beginning', function (done) {
        writer.createProject(action, function () {
            writer.createFile('This is a test', 'page', function () {
                checkExistence(true, [path.join('.', 'contents', 'pages', 'this-is-a-test.md')], done);
            });
        });
    });

    it('should clear all the created files', function (done) {
        writer.clearWorkspace(action, function () {
            checkExistence(false, paths, done);
        });
    });

});
