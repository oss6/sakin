'use strict';
var assert = require('assert');
var writer = require('../lib/writer');
var Reader = require('../lib/reader');
var ActionObservable = require('../lib/action-observable');

describe('reader', function () {

    var reader = new Reader();
    var action = new ActionObservable(true);

    afterEach(function (done) {
        writer.clearWorkspace(action, done);
    });

    describe('Reader', function () {
        assert.throws(function () {
            Reader();
        });
    });

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

        it('should throw an exception if the content is not properly formatted', function () {
            assert.throws(function () {
                reader.getContent('Hello how are you\n---');
            });
        });
    });

    describe('read', function () {

        it('should read correctly the pages', function (done) {
            writer.createProject(action, function () {
                reader.read('pages', function (contents) {
                    var page = contents[0];

                    assert.deepEqual(page.metadata, {title: 'Example', subtitle: 'This is an example page'});
                    assert.equal(page.content, '<p>This is an <strong>example</strong>. Hello everyone and welcome to <code>sakin</code>.</p>\n');
                    done();
                });
            });
        });

        it('should detect errors when the path does not exist', function (done) {
            reader.read('pages', function (contents, errors) {
                assert.equal(errors.length, 1);
                done();
            });
        });

    });

});
