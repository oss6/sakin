'use strict';
var path = require('path');
var ncp = require('ncp').ncp;
var mkdirp = require('mkdirp');
//var globals = require('./globals');

module.exports = (function () {

    var _ = {};

    _.createProject = function () {
        // Copy settings to blog
        ncp(path.join(__dirname, 'data', 'settings.json'), './settings.json', function (err) {
            if (err) {
                console.log(err);
            }
        });

        // Copy static
        ncp(path.join(__dirname, 'data', 'settings', 'static'), './static', function (err) {
            if (err) {
                console.log(err);
            }
        });

        // Copy templates
        ncp(path.join(__dirname, 'data', 'settings', 'templates'), './templates', function (err) {
            if (err) {
                console.log(err);
            }
        });

        // Create contents directory tree
        mkdirp(path.join('.', 'contents'), function (err) {
            if (err) {
                console.log(err);
            }
        });

        mkdirp(path.join('.', 'contents', 'pages'), function (err) {
            if (err) {
                console.log(err);
            }
        });

        mkdirp(path.join('.', 'contents', 'articles'), function (err) {
            if (err) {
                console.log(err);
            }
        });

        // Create output directory
        mkdirp(path.join('.', 'output'), function (err) {
            if (err) {
                console.log(err);
            }
        });

    };

    _.clearWorkspace = function () {
    };

    return _;

})();
