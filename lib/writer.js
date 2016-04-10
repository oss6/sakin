'use strict';
var path = require('path');
var fs = require('fs-extra');
var a = require('async');

module.exports = (function () {

    var _ = {};

    var sourcePrefix = path.join(__dirname, 'data');
    var destinationPrefix = '.';

    var paths = [
        'settings.json',
        'static',
        'templates',
        'contents'
    ];

    _.createProject = function (cb) {
        var pathsToGo = paths.length;

        paths.forEach(function (p) {
            fs.copy(path.join(sourcePrefix, p), path.join(destinationPrefix, p), function (err) {
                if (err) {
                    throw err;
                }

                if (--pathsToGo === 0) {
                    cb();
                }
            });
        });
    };

    _.clearWorkspace = function (cb) {
        var pathsToGo = paths.length;

        paths.forEach(function (p) {
            fs.remove(path.join(destinationPrefix, p), function (err) {
                if (err) {
                    throw err;
                }

                if (--pathsToGo === 0) {
                    cb();
                }
            });
        });
    };

    _.saveToOutput = function (files) {
        a.each(files, function (file, cb) {
            fs.outputFile(file.path, file.content, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Success');
                }

                cb();
            });
        }, function (err) {
            if (err) {
                // One of the iterations produced an error.
                console.log('A file failed to process');
            } else {
                console.log('All files have been processed successfully');
            }
        });
    };

    return _;

})();
