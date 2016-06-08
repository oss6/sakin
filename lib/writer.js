'use strict';
var path = require('path');
var fs = require('fs-extra');
var a = require('async');
var slug = require('slug');
var nj = require('nunjucks');
var git = require('simple-git');
var utils = require('./utils');

var x = module.exports;

nj.configure({ autoescape: true });

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

x.createProject = function (action, opts, cb) {
    var errors = [];

    var eachCb = function (p, next) {
        var source = p === 'templates' || p === 'static' ? path.join(sourcePrefix, 'themes', opts.theme, p) : path.join(sourcePrefix, p);
        var dest = path.join(destinationPrefix, p);

        fs.copy(source, dest, function (err) {
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

    var doneCb = function () {
        cb(errors);
    };

    a.each(paths, eachCb, doneCb);
};

x.clearWorkspace = function (action, cb) {
    var errors = [];

    var eachCb = function (p, next) {
        fs.remove(path.join(destinationPrefix, p), function (err) {
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

    var doneCb = function () {
        cb(errors);
    };

    // Delete contents/.git directory
    fs.remove(path.join('contents', '.git'), function (err) {
        /* istanbul ignore if  */
        if (err) {
            errors.push(err);
        }

        a.each(paths, eachCb, doneCb);
    });
};

x.saveToOutput = function (action, files, gcb) {
    var errors = [];

    a.each(files, function (file, cb) {
        fs.outputFile(file.path, file.content, function (err) {
            /* istanbul ignore if  */
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

x.createFile = function (title, type, cb) {
    var p = path.join('contents', type + 's', slug(title, {lower: true}) + '.md');

    fs.outputFile(p, x.getMetadata(type, title), function (err) {
        cb(err);
    });
};

/*x.createMenu = function () {
    // TODO
};*/
