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

    var checkExistsAll = function (cb) {
        var toGo = paths.length;

        paths.forEach(function (p) {
            fs.stat(path.join('.', p), function (err) {
                if (err) {
                    if (err.code === 'ENOENT') {
                        assert(false, 'The file should exist');
                    }
                } else {
                    assert(true);
                }

                if (--toGo === 0) {
                    cb();
                }
            });
        });
    };

    describe('createProject', function () {

        writer.createProject(function () {
            checkExistsAll(function () {
                writer.clearWorkspace();
            });
        });

    });

});
