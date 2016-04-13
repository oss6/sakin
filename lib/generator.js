'use strict';
var fs = require('fs-extra');
var nj = require('nunjucks');
var slug = require('slug');
var path = require('path');
var utils = require('./utils');
var writer = require('./writer');
var Reader = require('./reader');

var x = module.exports;

x.getGeneralContext = function () {
    var g = utils.loadSettings();
    return g;
};

x.createIndex = function (g, articles) {
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

    return {
        path: path.join('.', 'output', 'index.html'),
        url: g.root_url,
        content: res
    };
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

            fs.copy(file, p, function (err) {
                if (err) {
                    action.log('error', file + ' -> ' + p);
                    errors.push(err);
                } else if (--toGo === 0) {
                    cb(errors);
                } else {
                    action.log('success', file + ' -> ' + p);
                }
            });
        });
    });
};

x.generate = function (action, cb) {
    // Configure template engine
    nj.configure('templates', { autoescape: true });

    // Read pages and articles
    var g = x.getGeneralContext();
    var processed = [];
    var errors = [];
    var reader = new Reader('markdown');

    // Process pages
    // -------------
    reader.read('pages', function (pages, pErrors) {
        if (pErrors.length !== 0) {
            errors = errors.concat(pErrors);
            return;
        }

        // Process articles
        // ----------------
        reader.read('articles', function (articles, aErrors) {
            if (aErrors.length !== 0) {
                errors = errors.concat(aErrors);
                return;
            }

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
            processed.push(x.createIndex(g, articles));

            // Send processed files to output
            writer.saveToOutput(action, processed, function (saveErrors) {
                if (saveErrors.length !== 0) {
                    errors.concat(saveErrors);
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
    });
};
