'use strict';
var jsonfile = require('jsonfile');

var x = module.exports;

x.removeWhitespace = function (str, trld) {
    return !trld ? str.replace(/\s/g, '') : str.trim();
};

x.repeat = function (s, n) {
    return Array(n + 1).join(s);
};

x.parseKeyValue = function (str) {
    if (str.indexOf(':') === -1) {
        throw Error('Key value pair not properly formatted');
    }

    var parts = str.split(':').slice(0, 2).map(function (part) {
        return x.removeWhitespace(part, true);
    });

    return {
        key: parts[0],
        value: parts[1]
    };
};

x.loadSettings = function () {
    return jsonfile.readFileSync('settings.json');
};

x.extend = function (obj, src) {
    for (var key in src) {
        /* istanbul ignore else  */
        if (src.hasOwnProperty(key)) {
            obj[key] = src[key];
        }
    }
    return obj;
};

x.getDate = function () {
    var date = new Date();

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? '0' : '') + month;

    var day = date.getDate();
    day = (day < 10 ? '0' : '') + day;

    return year + '-' + month + '-' + day;
};
