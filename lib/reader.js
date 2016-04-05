'use strict';
var fs = require('fs');
var dir = require('node-dir');
var marked = require('marked');
var globals = require('./globals');

module.exports = Reader;

/**
 * - Read pages and articles and transform them to HTML
 * - If smart_generation is enabled then read and process only the pages and articles modified
 */

function Reader(readerType) {
    if (!(this instanceof Reader)) {
        throw new TypeError('Class constructor Concurrent cannot be invoked without \'new\'');
	}

    this.readerType = readerType;
}

Reader.prototype.read = function (what, cb) {
    var settings = globals.settings;

    // trim last / !!

    var dirPath = __dirname + '/' + settings.contents_path + '/' + settings[what === 'pages' ? 'pages_dir' : 'articles_dir'] + '/';
    var contents = [];

    dir.readFilesStream(dirPath,
        function (err, stream, next) {
            if (err) {
                throw err;
            }

            var content = '';
            stream.on('data', function (buffer) {
                content += buffer.toString();
            });
            stream.on('end', function () {
                contents.push(marked(content));
                next();
            });
        },
        function (err, files) {
            if (err) {
                throw err;
            }
            cb(contents);
        }
    );
};
