'use strict';
var path = require('path');
var ncp = require('ncp').ncp;
var mkdirp = require('mkdirp');
var utils = require('./utils');
var globals = require('./globals');

module.exports = (function () {

    var _ = {};

    _.createProject = function () {

        var settings = globals.loadSettings();

        // Copy settings to blog
        ncp(path.join(__dirname, 'data', 'settings.json'), './settings.json', function (err) {
            if (err) {

            }
        });

        // Copy static
        ncp(path.join(__dirname, 'data', 'settings', 'static'), './static', function (err) {
            if (err) {

            }
        });

        // Copy templates
        ncp(path.join(__dirname, 'data', 'settings', 'templates'), './templates', function (err) {
            if (err) {

            }
        });

        // Create contents directory tree
        mkdirp(path.join('./', settings.contents_path), function (err) {
            if (err) {

            }
        });

        mkdirp(path.join('./', settings.contents_path, settings.pages_dir), function (err) {
            if (err) {

            }
        });

        mkdirp(path.join('./', settings.contents_path, settings.articles_dir), function (err) {
            if (err) {

            }
        });

        // Create output directory
        mkdirp(path.join('./', settings.output_dir), function (err) {
            if (err) {

            }
        });

    };

    _.clearWorkspace = function () {
        
    };

    return _;

})();
