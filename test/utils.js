'use strict';
var mockFs = require('mock-fs');
var assert = require('assert');
var utils = require('../lib/utils');

describe('utils', function () {

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

        it('correctly gets the current date in ISO format.', function () {
            var datetime = new Date();
            assert.equal(utils.getDate().split('T')[0], datetime.toISOString().split('T')[0]);
        });

    });

    describe('extractISODate', function () {

        var tests = [
            {args: ['2016-05-01'], expected: {year: '2016', month: '05', day: '01'}},
            {args: ['1999-12-03'], expected: {year: '1999', month: '12', day: '03'}},
            {args: ['2011-10-05T14:48:00.000Z'], expected: {year: '2011', month: '10', day: '05', hours: '14', minutes: '48', seconds: '00'}},
            {args: ['2011-10-05T14:48:00'], expected: {year: '2011', month: '10', day: '05', hours: '14', minutes: '48', seconds: '00'}}
        ];

        tests.forEach(function (test) {
            it('correctly extracts the parts of an ISO formatted date.', function () {
                assert.deepEqual(utils.extractISODate.apply(null, test.args), test.expected);
            });
        });

        // Date not formatted properly tests
        var exceptionTests = [
            {args: ['']},
            {args: ['2016']},
            {args: ['2016-04']},
            {args: ['2016-04-12T']},
            {args: ['2016-04-12T13']},
            {args: ['2016-04-12T13:23']},
            {args: ['2016-04-12T13:23:05T2054']}
        ];

        exceptionTests.forEach(function (test) {
            it('correctly detects if a date is not properly formatted.', function () {
                assert.throws(function () {
                    utils.extractISODate.apply(null, test.args);
                });
            });
        });

    });

    describe('compareDates', function () {

        var tests = [
            {args: ['2016-06-08', '2016-06-08'], expected: 0},
            {args: ['2016-06-08', '2016-06-09'], expected: 1},
            {args: ['2016-06-08', '2016-06-09'], expected: 1},
            {args: ['2016-03-08', '2016-06-08'], expected: 1},
            {args: ['2015-03-23', '2016-06-08'], expected: 1},
            {args: ['2016-06-08', '2016-01-03'], expected: -1},
            {args: ['2017-12-23', '2002-01-02'], expected: -1},
            {args: ['2016-06-08T13:00:00', '2016-06-08T15:03:34'], expected: 1},
            {args: ['2016-06-08T22:12:45', '2016-06-08T15:03:34'], expected: -1}
        ];

        tests.forEach(function (test) {
            it('correctly compares two ISO formatted dates.', function () {
                assert.equal(Math.sign(utils.compareDates.apply(null, test.args)), test.expected);
            });
        });

    });

});
