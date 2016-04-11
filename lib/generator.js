'use strict';
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

x.generate = function (cb) {
    // Configure template engine
    nj.configure('templates', { autoescape: true });

    // Read pages and articles
    var g = x.getGeneralContext();
    var processed = [];
    var reader = new Reader('markdown');

    reader.read('pages', function (pages, pErrors) {
        if (pErrors.length !== 0) {
            cb(pErrors);
            return;
        }

        reader.read('articles', function (articles, aErrors) {
            if (aErrors.length !== 0) {
                cb(aErrors);
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

            // Send all files to output
            writer.saveToOutput(processed, function (saveErrors) {
                cb(saveErrors);
            });
        });
    });
};
