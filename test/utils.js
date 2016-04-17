'use strict';
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

});
