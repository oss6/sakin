'use strict';
var assert = require('assert');
var writer = require('../lib/writer');
var reader = require('../lib/reader');
var ActionObservable = require('../lib/action-observable');

describe('reader', function () {

    var action = new ActionObservable(true);
    var opts = { theme: 'default' };

    describe('getContent', function () {

        var tests = [
            {arg: '---\nkey: value\n---', expected: [{key: 'value'}, '', null]},
            {arg: 'key: value\n---', expected: [null, null]}
        ];

        tests.forEach(function (test, i) {
            it('correctly gets the content and metadata ' + (i + 1) + '.', function (done) {
                reader.getContent(test.arg, function (actual, error) {
                    if (error !== null) {
                        assert.equal(actual, test.expected[0]);
                        assert.equal(actual, test.expected[1]);
                    } else {
                        assert.deepEqual(actual.metadata, test.expected[0]);
                        assert.deepEqual(actual.content, test.expected[1]);
                        assert.equal(error, test.expected[2]);
                    }

                    done();
                });
            });
        });

    });

    describe('read', function () {

        after(function (done) {
            writer.clearWorkspace(action, function () {
                done();
            });
        });

        it('should read correctly the pages', function (done) {
            writer.createProject(action, opts, function () {
                reader.read('pages', ['example.md'], function (contents) {
                    var page = contents[0];

                    assert.deepEqual(page.metadata, {title: 'Example', subtitle: 'This is an example page', path: 'contents/pages/example.md'});
                    assert.equal(page.content, '<p>This is an <strong>example</strong>. Hello everyone and welcome to <code>sakin</code>.</p>\n');
                    done();
                });
            });
        });

        it('should detect errors when the path does not exist', function (done) {
            writer.clearWorkspace(action, function () {
                reader.read('pages', ['example.md'], function (contents, errors) {
                    assert.equal(errors.length, 1);
                    done();
                });
            });
        });

    });

});
