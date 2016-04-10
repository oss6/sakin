'use strict';
var nj = require('nunjucks');
var utils = require('./utils');
var Reader = require('./reader');

module.exports = Generator;

function Generator() {

}

Generator.prototype.getGeneralContext = function () {
    var g = utils.loadSettings();
    return g;
};

Generator.prototype.generate = function () {
    // Configure template engine
    nj.configure('templates', { autoescape: true });

    // Read pages and articles
    var reader = new Reader('markdown');
    var g = this.getGeneralContext();

    reader.read('pages', function (pages) {
        reader.read('articles', function (articles) {

            g.type = 'page';
            pages.forEach(function (page) {
                var pageContext = utils.extend({g: g, content: page.content}, page.metadata);

                nj.render('page.html', pageContext);
            });

            g.type = 'article';
            articles.forEach(function (article) {
                var articleContext = utils.extend({g: g, content: article.content}, article.metadata);

                nj.render('article.html', articleContext);
            });

        });
    });

    // Generate index.html

};
