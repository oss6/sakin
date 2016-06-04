'use strict';
var assert = require('assert');
var fs = require('fs-extra');
var path = require('path');
var a = require('async');
var writer = require('../lib/writer');
var ActionObservable = require('../lib/action-observable');

describe('writer', function () {

    var paths = [
        'settings.json',
        'static',
        'templates',
        'contents'
    ];

    var checkExistence = function (checkExists, ps, cb) {
        var toGo = ps.length;

        if (toGo === 0) {
            cb();
            return;
        }

        ps.forEach(function (p) {
            fs.stat(path.join('.', p), function (err) {
                if (err) {
                    if (err.code === 'ENOENT') {
                        assert(!checkExists, checkExists ? 'The file should exist' : '');
                    }
                } else {
                    assert(checkExists, !checkExists ? 'The file should not exist' : '');
                }

                if (--toGo === 0 && cb !== undefined) {
                    cb();
                }
            });
        });
    };

    var action = new ActionObservable(true);

    after(function (done) {
        writer.clearWorkspace(action, function () {
            done();
        });
    });

    describe('createProject', function () {
        it('should create all the necessary files', function (done) {
            writer.createProject(action, function () {
                checkExistence(true, paths, done);
            });
        });
    });

    describe('clearWorkspace', function () {
        it('should clear all the created files', function (done) {
            writer.createProject(action, function () {
                writer.clearWorkspace(action, function () {
                    checkExistence(false, paths, done);
                });
            });
        });
    });

    describe('saveToOutput', function () {
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
    });

    describe('createFile', function () {
        it('should create the example files created at the beginning', function (done) {
            writer.createProject(action, function () {
                writer.createFile('This is a test', 'page', function () {
                    checkExistence(true, [path.join('.', 'contents', 'pages', 'this-is-a-test.md')], done);
                });
            });
        });
    });

});
