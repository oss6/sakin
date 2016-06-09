'use strict';
var a = require('async');
var slug = require('slug');
var path = require('path');
var nj = require('nunjucks');
var fs = require('fs-extra');
var utils = require('./utils');
var git = require('simple-git');

// ..............................................
// :  writer.js
// :
// :  Provides functionality for writing
// :  to output, transferring files
// :  and clearing the workspace
// ..............................................

var x = module.exports;

// Globals
// ==============================================

var contentsRepo = git('contents');
var sourcePrefix = path.join(__dirname, 'data');
var destinationPrefix = '.';
var paths = [
    'settings.json',
    '.sakin',
    'static',
    'templates',
    'contents',
    'output'
];

nj.configure({ autoescape: true });

x.clearWorkspace = function (action, cb) {
    var errors = [];

    var eachCb = (p, next) => {
        fs.remove(path.join(destinationPrefix, p), err => {
            /* istanbul ignore if  */
            if (err) {
                action.log('error', p);
                errors.push(err);
            } else {
                action.log('success', p);
            }
            next();
        });
    };

    var doneCb = () => {
        cb(errors);
    };

    // Delete contents/.git directory
    fs.remove(path.join('contents', '.git'), err => {
        /* istanbul ignore if  */
        if (err) {
            errors.push(err);
        }

        a.each(paths, eachCb, doneCb);
    });
};

x.createFile = function (title, type, cb) {
    var p = path.join('contents', type + 's', slug(title, {lower: true}) + '.md');

    fs.outputFile(p, x.getMetadata(type, title), err => {
        cb(err);
    });
};

x.createProject = function (action, opts, cb) {
    var errors = [];

    var eachCb = (p, next) => {
        var source =
            p === 'templates' || p === 'static'
            ? path.join(sourcePrefix, 'themes', opts.theme, p)
            : path.join(sourcePrefix, p);
        var dest = path.join(destinationPrefix, p);

        fs.copy(source, dest, err => {
            /* istanbul ignore if  */
            if (err) {
                action.log('error', p);
                errors.push(err);
            } else {
                /* istanbul ignore if  */
                if (p === 'contents') {
                    contentsRepo.init();
                }
                action.log('success', p);
            }

            next();
        });
    };

    var doneCb = () => {
        cb(errors);
    };

    a.each(paths, eachCb, doneCb);
};

x.getMetadata = function (type, title) {
    var str = '---\ntitle: {{ title }}\nsubtitle: {{ subtitle }}\n---\n';
    var context = {
        title: title,
        subtitle: 'An awesome page'
    };

    if (type === 'article') {
        var settings;
        try {
            settings = utils.loadSettings();
        } catch (e) {
            settings = { author: 'Change me' };
        }

        str = '---\ntitle: {{ title }}\nsubtitle: {{ subtitle }}\nauthor: {{ author }}\ndate: {{ date }}\n---\n';
        context = {
            title: title,
            subtitle: 'An awesome article',
            author: settings.author,
            date: utils.getDate()
        };
    }

    return nj.renderString(str, context);
};

x.saveToOutput = function (action, files, gcb) {
    var errors = [];

    a.each(
        files,
        // Each callback
        (file, next) => {
            fs.outputFile(file.path, file.content, err => {
                /* istanbul ignore if  */
                if (err) {
                    action.log('error', 'Failed to create ' + file.path);
                    errors.push(err);
                } else {
                    action.log('success', 'Created ' + file.path);
                }
                next();
            });
        },
        // Done callback
        () => {
            gcb(errors);
        }
    );
};

/*x.createMenu = function () {
    // TODO
};*/
