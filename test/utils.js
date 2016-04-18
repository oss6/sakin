'use strict';
var mockFs = require('mock-fs');
var assert = require('assert');
var readline = require('readline');
var utils = require('../lib/utils');

describe('utils', function () {

    describe('streamify', function () {

        it('correctly streamify the input string', function (done) {
            var lineReader = readline.createInterface({
                input: utils.streamify('hello\nhow are you?\nI was wondering if\nthis module was useful')
            });

            var expected = [
                'hello',
                'how are you?',
                'I was wondering if',
                'this module was useful'
            ];

            var index = 0;
            lineReader.on('line', function (line) {
                assert.equal(line, expected[index]);
                index++;
            });

            lineReader.on('close', done);
        });

    });

    describe('removeWhitespace', function () {

        var tests = [
            {args: ['hello   ', true], expected: 'hello'},
            {args: [' hello   ', true], expected: 'hello'},
            {args: ['    hello   ', true], expected: 'hello'},
            {args: ['     h e l  l o   ', true], expected: 'h e l  l o'},
            {args: ['hello   ', false], expected: 'hello'},
            {args: [' hello   ', false], expected: 'hello'},
            {args: ['    hello   ', false], expected: 'hello'},
            {args: ['     h e l  l o   ', false], expected: 'hello'}
        ];

        tests.forEach(function (test) {
            it('correctly removes whitespace from all positions.', function () {
                assert.equal(utils.removeWhitespace.apply(null, test.args), test.expected);
            });
        });

    });

    describe('repeat', function () {

        var tests = [
            {args: ['s', 5], expected: 'sssss'},
            {args: ['ha', 5], expected: 'hahahahaha'},
            {args: ['H', 1], expected: 'H'},
            {args: ['|', 0], expected: ''},
            {args: ['|', 3], expected: '|||'}
        ];

        tests.forEach(function (test) {
            it('correctly repeats a given string n times.', function () {
                assert.equal(utils.repeat.apply(null, test.args), test.expected);
            });
        });

    });

    describe('parseKeyValue', function () {

        var tests = [
            {args: ['key: value'], expected: {key: 'key', value: 'value'}},
            {args: ['  hello  : how are you? '], expected: {key: 'hello', value: 'how are you?'}},
            {args: ['scripts:npm test'], expected: {key: 'scripts', value: 'npm test'}}
        ];

        tests.forEach(function (test) {
            it('correctly parses a key value string pair.', function () {
                assert.deepEqual(utils.parseKeyValue.apply(null, test.args), test.expected);
            });
        });

        it('correctly raises an exception when it is not possible to parse.', function () {
            assert.throws(function () {
                utils.parseKeyValue('this is awesome');
            });

            assert.throws(function () {
                utils.parseKeyValue('');
            });
        });

    });

    describe('loadSettings', function () {

        beforeEach(function () {
            mockFs({
                'settings.json': '{"url": "http://example.com/","rootUrl": "/"}'
            });
        });
        afterEach(mockFs.restore);

        it('correctly loads the settings.', function () {
            var settings = utils.loadSettings();
            assert.deepEqual(settings, {
                url: 'http://example.com/',
                rootUrl: '/'
            });
        });

    });

    describe('extend', function () {

        var tests = [
            {args: [{}, {}], expected: {}},
            {args: [{test: 34, test1: 'how come?'}, {}], expected: {test: 34, test1: 'how come?'}},
            {args: [{}, {test: 34, test1: 'how come?'}], expected: {test: 34, test1: 'how come?'}},
            {args: [{test2: 'hello'}, {test: 34, test1: 'how come?'}], expected: {test: 34, test1: 'how come?', test2: 'hello'}}
        ];

        tests.forEach(function (test) {
            it('correctly merges two objects.', function () {
                assert.deepEqual(utils.extend.apply(null, test.args), test.expected);
            });
        });

    });

    describe('getDate', function () {

        var leftpad = function (str, len, ch) {
            str = String(str);
            var i = -1;

            if (!ch && ch !== 0) {
                ch = ' ';
            }
            len = len - str.length;

            while (++i < len) {
                str = ch + str;
            }

            return str;
        };

        it('correctly gets the current date in ISO format.', function () {
            var datetime = new Date();
            var year = datetime.getFullYear();
            var month = leftpad(datetime.getMonth() + 1, 2, 0);
            var day = leftpad(datetime.getDate(), 2, 0);

            assert.deepEqual(utils.getDate(), year + '-' + month + '-' + day);
        });

    });

});
