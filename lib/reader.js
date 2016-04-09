'use strict';
var dir = require('node-dir');
var path = require('path');
//var readline = require('readline');
//var marked = require('marked');
var globals = require('./globals');
var utils = require('./utils');

module.exports = Reader;

function Reader(readerType) {
    if (!(this instanceof Reader)) {
        throw new TypeError('Class constructor Concurrent cannot be invoked without \'new\'');
	}

    this.readerType = readerType;
}

Reader.prototype.getContent = function (content) {
    var lines = content.split(/\r?\n/);
    var isProcessingMetadata = true;
    var metadata = {};
    var output = {
        metadata: {},
        content: []
    };

    lines.forEach(function (line, i) {
        var ln = line.replace(/\s/g, line);

        if (i === 0 && ln !== '---') {
            throw new Error('File should start with "---" delimiter for metadata');
        } else if (i === 0) {
            return;
        } else if (i !== 0 && ln === '---') {
            output.metadata = metadata;
            isProcessingMetadata = false;
            return;
        }

        if (!isProcessingMetadata) {
            // Content processing
            output.content.push(line);
        } else {
            // Metadata processing
            var pair = utils.parseKeyValue(line);
            metadata[pair.key] = pair.value;
        }
    });

    return output;

    /*var lineReader = readline.createInterface({
        input: utils.streamify(content)
    });

    lineReader.setData = function (data) {
        this.data = data;
    };

    lineReader.getData = function () {
        return this.data;
    };

    lineReader.setData({
        matchedEnd: false,
        metadata: {},
        output: {
            metadata: {},
            content: []
        },
        index: 0
    });

    lineReader.on('line', function (line) {
        var data = lineReader.getData();
        var ln = line.replace(/\s/g, line);

        console.log(data.index + ': ' + line);

        if (data.matchedEnd) {
            // Content processing
            output.content.push(line);
        } else {
            // Metadata processing
            var pair = utils.parseKeyValue(line);
            data.metadata[pair.key] = pair.value;
        }

        if (data.index === 0 && ln !== '---') {
            throw new Error('File should start with "---" delimiter for metadata');
        }

        if (data.index !== 0 && ln === '---') {
            data.output.metadata = data.metadata;
            data.matchedEnd = true;
        }

        data.index++;
    })
    .on('close', function () {
        console.log('yaaaassdsdsdsdsd');
        cb(output);
    });*/
};

Reader.prototype.read = function (what, cb) {
    var settings = globals.loadSettings();

    // trim last / !!

    var dirPath = path.join('.', settings.contents_path, settings[what === 'pages' ? 'pages_dir' : 'articles_dir']);
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
                contents.push(this.getContent(content));
                next();
            });
        },
        function (err, files) {
            if (err) {
                throw err;
            }
            cb(contents, files);
        }
    );
};
