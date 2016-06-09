'use strict';
var jsonfile = require('jsonfile');

// ..............................................
// :  utils.js
// :
// :  Provides utility functions
// ..............................................

var x = module.exports;

x.chooseOption = function (opt1, opt2, defaultVal) {
    if (opt1 !== undefined) {
        return opt1;
    }

    if (opt2 !== undefined) {
        return opt2;
    }

    return defaultVal;
};

x.compareDates = function (date1, date2) {
    return new Date(date2) - new Date(date1);
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

x.extractISODate = function (date) {
    date.trim();

    if (date === '') {
        throw Error('Date not formatted properly');
    }

    var parts = date.split('T');
    var out = {};

    if (parts.length > 2) {
        throw Error('Date not formatted properly');
    }

    var subpartsDate = parts[0].split('-');

    if (subpartsDate.length !== 3) {
        throw Error('Date not formatted properly');
    }

    out.year = subpartsDate[0];
    out.month = subpartsDate[1];
    out.day = subpartsDate[2];

    if (parts.length === 2) {
        var subpartsTime = parts[1].split(':');

        if (subpartsTime.length !== 3) {
            throw Error('Date not formatted properly');
        }

        out.hours = subpartsTime[0];
        out.minutes = subpartsTime[1];
        out.seconds = subpartsTime[2].split('.')[0];
    }

    return out;
};

x.getDate = function () {
    return (new Date()).toISOString();
};

x.loadSettings = function () {
    return jsonfile.readFileSync('settings.json');
};

x.parseKeyValue = function (str) {
    if (str.indexOf(':') === -1) {
        throw Error('Key value pair not properly formatted');
    }

    var parts = str.split(/:/);
    var key = parts.shift();
    var val = parts.join(':');

    return {
        key: x.removeWhitespace(key, true),
        value: x.removeWhitespace(val, true)
    };
};

x.removeWhitespace = function (str, trld) {
    return !trld ? str.replace(/\s/g, '') : str.trim();
};

x.repeat = function (s, n) {
    return Array(n + 1).join(s);
};

x.titleCase = function (str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.replace(word[0], word[0].toUpperCase()))
        .join(' ');
};
