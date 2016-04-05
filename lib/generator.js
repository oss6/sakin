'use strict';
var globals = require('./globals');
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

function Generator() {

}

Generator.prototype.generate = function () {
    // Load settings
    globals.loadSettings();

    // Read pages and articles
    var reader = new Reader('markdown');
    reader.read('pages', function (pages) {
        reader.read('articles', function (articles) {
            
        });
    });

};
