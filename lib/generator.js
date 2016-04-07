'use strict';
var nj = require('nunjucks');
var Reader = require('./reader');

/**
 * Main entry point
 *
 * - Get reader
 * - Use reader to get and convert pages and articles (just contents)
 * - Generate index.html
 * - Use templates and replace placeholders with content
 * - Use writer module to write to the output directory
 *
 */

module.exports = Generator;

/*var getPageContext = function () {
    // title
    // content
    //
};

var getArticleContext = function () {

};*/

function Generator() {

}

Generator.prototype.generate = function () {
    // Configure template engine
    nj.configure('todo', { autoescape: true });

    // Read pages and articles
    var reader = new Reader('markdown');
    reader.read('pages', function (pages) {
        reader.read('articles', function (articles) {

            //var writer = new Writer();

            pages.forEach(function (page) {
                var pageContext = {
                    content: page
                };

                nj.render('page.html', pageContext);
            });

            articles.forEach(function (article) {
                var articleContext = {
                    content: article
                };

                nj.render('article.html', articleContext);
            });

        });
    });

    // Generate index.html

};
