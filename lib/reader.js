'use strict';
var dir = require('node-dir');
var path = require('path');
var Remarkable = require('remarkable');
var sts = require('string-to-stream');
var readline = require('readline');
//var Git = require('nodegit');
var utils = require('./utils');
var md = new Remarkable();

module.exports = Reader;

function Reader(readerType) {
    if (!(this instanceof Reader)) {
        throw new TypeError('Class constructor Reader cannot be invoked without \'new\'');
	}

    this.readerType = readerType;
}

Reader.prototype.getContent = function (text, cb) {
    text += '\n';

    var lineReader = readline.createInterface({
        input: sts(text),
        terminal: false
    });

    var matchedEnd = false;
    var error = false;
    var metadata = {};
    var content = [];
    var output = {
        metadata: {},
        content: ''
    };
    var index = 0;

    lineReader.on('line', function (line) {
        var ln = line.replace(/\s/g, line);

        if (matchedEnd) {
            // Content processing
            content.push(line);
        } else if (index !== 0 && ln !== '---') {
            // Metadata processing
            var pair = utils.parseKeyValue(line);
            metadata[pair.key] = pair.value;
        }

        if (index === 0 && ln !== '---') {
            error = true;
            lineReader.close();
        }

        if (index !== 0 && ln === '---') {
            output.metadata = metadata;
            matchedEnd = true;
        }

        index++;
    })
    .on('close', function () {
        if (!error) {
            output.content = md.render(content.join('\n'));
            cb(output, null);
        } else {
            cb(null, 'Metadata not properly formatted');
        }
    });
};

Reader.prototype.read = function (what, cb) {
    var dirPath = path.join('.', 'contents', what);
    var contents = [];
    var errors = [];
    var self = this;

    dir.readFilesStream(dirPath,
        function (err, stream, next) {
            if (err) {
                errors.push(err);
                return;
            }

            var content = '';
            stream.on('data', function (buffer) {
                content += buffer.toString();
            });
            stream.on('end', function () {
                self.getContent(content, function (output, error) {
                    if (!error) {
                        contents.push(output);
                    } else {
                        errors.push(error);
                    }

                    next();
                });
            });
        },
        function (err) {
            if (err) {
                errors.push(err);
            }
            cb(contents, errors);
        }
    );
};
