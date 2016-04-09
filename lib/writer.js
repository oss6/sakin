'use strict';
var path = require('path');
var fs = require('fs-extra');

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

    return _;

})();
