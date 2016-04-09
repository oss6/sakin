'use strict';
var stream = require('stream');

var x = module.exports;

x.streamify = function (text) {
    var s = new stream.Readable();
    s._read = function noop() {};
    s.push(text);
    s.push(null);
    return s;
};

x.removeWhitespace = function (str) {
    return str.replace(/\s/g, '');
};

x.parseKeyValue = function (str) {
    str = x.removeWhitespace(str);

    if (str.indexOf(':') === -1) {
        throw Error('Key value pair not properly formatted');
    }

    var parts = str.split(':').slice(0, 2);
    return {
        key: parts[0],
        value: parts[1]
    };
};
