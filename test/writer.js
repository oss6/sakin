'use strict';
var assert = require('assert');
var fs = require('fs-extra');
var path = require('path');
var writer = require('../lib/writer');

describe('writer', function () {

    var paths = [
        'settings.json',
        'static',
        'templates',
        'contents'
    ];

    var checkExistence = function (checkExists, cb) {
        var toGo = paths.length;

        paths.forEach(function (p) {
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

    describe('createProject', function () {
        it('should create all the necessary files', function (done) {
            writer.createProject(function () {
                checkExistence(true, function () {
                    writer.clearWorkspace(done);
                });
            });
        });
    });

    describe('clearWorkspace', function () {
        it('should clear all the created files', function (done) {
            writer.createProject(function () {
                writer.clearWorkspace(function () {
                    checkExistence(false, done);
                });
            });
        });
    });

    describe('saveToOutput', function () {

    });

    describe('createFile', function () {

    });

});
