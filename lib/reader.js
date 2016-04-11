'use strict';
var dir = require('node-dir');
var path = require('path');
var marked = require('marked');
var utils = require('./utils');

module.exports = Reader;

function Reader(readerType) {
    if (!(this instanceof Reader)) {
        throw new TypeError('Class constructor Reader cannot be invoked without \'new\'');
	}

    this.readerType = readerType;
}

Reader.prototype.getContent = function (text) {
    var lines = text.split(/\r?\n/);
    var isProcessingMetadata = true;
    var metadata = {};
    var content = [];
    var output = {
        metadata: {},
        content: ''
    };

    lines.forEach(function (line, i) {
        var ln = line.replace(/\s/g, '');

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
            content.push(line);
            //output.content.push(line);
        } else {
            // Metadata processing
            var pair = utils.parseKeyValue(line);
            metadata[pair.key] = pair.value;
        }
    });

    output.content = marked(content.join('\n'));
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
    var settings = utils.loadSettings();
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
                contents.push(self.getContent(content));
                next();
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
