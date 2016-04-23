'use strict';
var fs = require('fs-extra');
var nj = require('nunjucks');
var slug = require('slug');
var path = require('path');
var git = require('simple-git');
var utils = require('./utils');
var writer = require('./writer');
var reader = require('./reader');

var x = module.exports;
var contentsRepo = git(path.join('.', 'contents'));

x.getModifiedFiles = function (cb) {
    contentsRepo.add('.', function () {
        contentsRepo.status(function (err, status) {
            var pageFiles = [];
            var articleFiles = [];

            if (!err) {
                // Get modified + created
                var all = status.modified.concat(status.created);

                all.forEach(function (file) {
                    var parts = file.split(path.sep);
                    var type = parts[0];
                    var fileName = parts[1];

                    if (type === 'pages') {
                        pageFiles.push(fileName);
                    } else if (type === 'articles') {
                        articleFiles.push(fileName);
                    }
                });
            }

            cb(err, pageFiles, articleFiles);
        });
    });
};

x.createIndex = function (g, cb) { // articles
    reader.read('articles', 'all', function (articles, errors) {
        articles = articles.map(function (article) {
            var date = article.metadata.date.split('-');
            var urlParts = ['blog', date[0], date[1], date[2], slug(article.metadata.title, {lower: true})];

            return utils.extend(article.metadata, {
                url: g.root_url + urlParts.join('/')
            });
        });

        var res = nj.render('index.html', {
            g: g,
            articles: articles
        });

        cb({
            path: path.join('.', 'output', 'index.html'),
            url: g.root_url,
            content: res
        }, errors);
    });
};

x.transferStatic = function (action, cb) {
    var staticPath = path.join('.', 'static');
    var errors = [];

    fs.readdir(staticPath, function (err, files) {
        if (err) {
            errors.push(err);
            return;
        }

        var toGo = files.length;

        files.map(function (file) {
            return path.join(staticPath, file);
        }).forEach(function (file) {
            var p = path.join('.', 'output', path.basename(file));

            fs.copy(file, p, function (copyErr) {
                if (err) {
                    action.log('error', file + ' -> ' + p);
                    errors.push(copyErr);
                } else if (--toGo === 0) {
                    cb(errors);
                } else {
                    action.log('success', file + ' -> ' + p);
                }
            });
        });
    });
};

x.processFiles = function (action, pages, articles, errors, cb) {
    var processed = [];
    var g = utils.loadSettings(); // general context

    // Process pages
    g.type = 'page';
    pages.forEach(function (page) {
        var pageContext = utils.extend({g: g, content: page.content}, page.metadata);
        var res = nj.render('page.html', pageContext);
        var title = slug(page.metadata.title, {lower: true});

        processed.push({
            path: path.join('.', 'output', title, 'index.html'),
            url: title,
            content: res
        });
    });

    // Process articles
    g.type = 'article';
    articles.forEach(function (article) {
        var articleContext = utils.extend({g: g, content: article.content}, article.metadata);
        var res = nj.render('article.html', articleContext);

        var date = article.metadata.date.split('-');
        var urlParts = ['blog', date[0], date[1], date[2], slug(article.metadata.title, {lower: true})];

        processed.push({
            path: path.join.apply(null, ['.', 'output'].concat(urlParts).concat(['index.html'])),
            url: urlParts.join('/'),
            content: res
        });
    });

    // Generate index.html
    g.type = 'index';
    x.createIndex(g, function (res, errors) {
        if (errors.length === 0) {
            processed.push(res);
        }

        // Send processed files to output
        writer.saveToOutput(action, processed, function (saveErrors) {
            if (saveErrors.length !== 0) {
                errors.concat(saveErrors);
            }

            if (pages.length !== 0 || articles.length !== 0) {
                contentsRepo.commit('Change contents');
            }

            // Transfer static
            x.transferStatic(action, function (transferErrors) {
                if (transferErrors.length !== 0) {
                    errors.concat(transferErrors);
                }
                cb(errors);
            });
        });
    });
};

x.generate = function (action, cb) {
    var errors = [];

    // Configure template engine
    nj.configure('templates', { autoescape: true });

    x.getModifiedFiles(function (err, pageFiles, articleFiles) {
        reader.read('pages', pageFiles, function (pages, pErrors) {
            if (pErrors.length !== 0) {
                errors = errors.concat(pErrors);
                //return;
            }

            reader.read('articles', articleFiles, function (articles, aErrors) {
                if (aErrors.length !== 0) {
                    errors = errors.concat(aErrors);
                    //return;
                }

                x.processFiles(action, pages, articles, errors, cb);
            });
        });
    });
};
