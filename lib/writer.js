'use strict';
var path = require('path');
var fs = require('fs-extra');
var a = require('async');
var slug = require('slug');
var nj = require('nunjucks');
var utils = require('./utils');

module.exports = (function () {

    nj.configure({ autoescape: true });

    var _ = {};

    var sourcePrefix = path.join(__dirname, 'data');
    var destinationPrefix = '.';

    var paths = [
        'settings.json',
        'static',
        'templates',
        'contents',
        'output'
    ];

    var getMetadata = function (type, title) {
        var str = '---\ntitle: {{ title }}\nsubtitle: {{ subtitle }}\n---\n';
        var context = {
            title: title,
            subtitle: 'An awesome page'
        };

        if (type === 'article') {
            var settings = utils.loadSettings();

            str = '---\ntitle: {{ title }}\nsubtitle: {{ subtitle }}\nauthor: {{ author }}\ndate: {{ date }}\n---\n';
            context = {
                title: title,
                subtitle: 'An awesome page',
                author: settings.author,
                date: utils.getDate()
            };
        }

        return nj.renderString(str, context);
    };

    _.createProject = function (action, cb) {
        var pathsToGo = paths.length;
        var errors = [];

        paths.forEach(function (p) {
            fs.copy(path.join(sourcePrefix, p), path.join(destinationPrefix, p), function (err) {
                if (err) {
                    action.log('error', p);
                    errors.push(err);
                } else if (--pathsToGo === 0) {
                    cb(errors);
                } else {
                    action.log('success', p);
                }
            });
        });
    };

    _.clearWorkspace = function (action, cb) {
        var pathsToGo = paths.length;
        var errors = [];

        paths.forEach(function (p) {
            fs.remove(path.join(destinationPrefix, p), function (err) {
                if (err) {
                    action.log('error', p);
                    errors.push(err);
                } else if (--pathsToGo === 0) {
                    cb(err);
                } else {
                    action.log('success', p);
                }
            });
        });
    };

    _.saveToOutput = function (action, files, gcb) {
        var errors = [];

        a.each(files, function (file, cb) {
            fs.outputFile(file.path, file.content, function (err) {
                if (err) {
                    action.log('error', 'Failed to create ' + file.path);
                    errors.push(err);
                } else {
                    action.log('success', 'Created ' + file.path);
                }
                cb();
            });
        }, function () {
            gcb(errors);
        });
    };

    _.createFile = function (title, type, cb) {
        var p = path.join('.', 'contents', type + 's', slug(title, {lower: true}) + '.md');

        fs.outputFile(p, getMetadata(type, title), function (err) {
            cb(err);
        });
    };

    return _;

})();
