'use strict';
var stream = require('stream');

module.exports = {
    streamify: function (text) {
        var s = new stream.Readable();
        s._read = function noop() {};
        s.push(text);
        s.push(null);
    }
};
