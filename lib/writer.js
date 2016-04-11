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

    _.createFile = function (title, type, cb) {
        var p = path.join('.', 'contents', type + 's', slug(title, {lower: true}) + '.md');

        fs.outputFile(p, getMetadata(type, title), function (err) {
            if (!err) {
                console.log('Yeaahhh!');
            }

            cb(err);
        });
    };

    return _;

})();
