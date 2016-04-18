'use strict';
var assert = require('assert');
var ActionObservable = require('../lib/action-observable');

describe('ActionObservable', function () {

    describe('silent log', function () {
        it('should not log', function () {
            var action = new ActionObservable(true);

            action.on('log', function () {
                assert(false);
            });

            action.log('test', 'hello');
        });
    });

    describe('log', function () {
        it('should log the given text', function (done) {
            var action = new ActionObservable(false);

            action.on('log', function (type, text) {
                assert.equal(type, 'test');
                assert.equal(text, 'hello');
                done();
            });

            action.log('test', 'hello');
        });
    });
});
