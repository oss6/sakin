'use strict';
var assert = require('assert');
var writer = require('../lib/writer');
var Reader = require('../lib/reader');
var ActionObservable = require('../lib/action-observable');

describe('reader', function () {

    var reader = new Reader();
    var action = new ActionObservable(true);

    describe('getContent', function () {

        var tests = [
            {args: ['---\nkey: value\n---'], expected: [{key: 'value'}, '']}
        ];

        tests.forEach(function (test, i) {
            it('correctly gets the content and metadata ' + (i + 1) + '.', function () {
                var actual = reader.getContent.apply(reader, test.args);

                assert.deepEqual(actual.metadata, test.expected[0]);
                assert.deepEqual(actual.content, test.expected[1]);
            });
        });

    });

    describe('read', function () {

        writer.createProject(action, function () {
        });

    });

});
