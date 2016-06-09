'use strict';
var dir = require('node-dir');
var path = require('path');
var Remarkable = require('remarkable');
var sts = require('string-to-stream');
var readline = require('readline');
var utils = require('./utils');

// ..............................................
// :  reader.js
// :
// :  Provides functionality for reading
// :  and processing a directory of
// :  content files.
// ..............................................

var x = module.exports;

var md = new Remarkable({
    html: true
});

x.getContent = function (text, cb) {
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

    lineReader.on('line', line => {
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
    .on('close', () => {
        if (!error) {
            output.content = md.render(content.join('\n'));
            cb(output, null);
        } else {
            cb(null, 'Metadata not properly formatted');
        }
    });
};

x.read = function (what, files, cb) {
    var errors = [];
    var contents = [];
    var dirPath = path.join('contents', what);
    var opts = files === 'all' ? {} : {match: files};

    dir.readFilesStream(
        dirPath,
        opts,

        (err, stream, next) => {
            /* istanbul ignore if  */
            if (err) {
                errors.push(err);
                return;
            }

            var content = '';
            stream.on('data', buffer => {
                content += buffer.toString();
            });
            stream.on('end', function () {
                x.getContent(content, (output, error) => {
                    /* istanbul ignore else  */
                    if (!error) {
                        output.metadata.path = stream.path;
                        contents.push(output);
                    } else {
                        errors.push(error);
                    }

                    next();
                });
            });
        },

        err => {
            if (err) {
                errors.push(err);
            }
            cb(contents, errors);
        }
    );
};
