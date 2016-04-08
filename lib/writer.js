'use strict';
var path = require('path');
var fs = require('fs-extra');
//var globals = require('./globals');

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

    _.createProject = function () {
        paths.forEach(function (p) {
            fs.copy(path.join(sourcePrefix, p), path.join(destinationPrefix, p), function (err) {
                if (err) {
                    console.log(err);
                }
            });
        });
    };

    _.clearWorkspace = function () {
        paths.forEach(function (p) {
            fs.remove(path.join(destinationPrefix, p), function (err) {
                if (err) {
                    console.log(err);
                }
            });
        });
    };

    return _;

})();
