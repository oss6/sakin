'use strict';
var assert = require('assert');
var http = require('http');
var fs = require('fs-extra');
var path = require('path');
var createServer = require('../lib/serve');
var server = createServer('output-test');

describe('/', function () {
    before(function (done) {
        // Create directory and listen
        fs.outputFile(path.join('.', 'output-test', 'index.html'), '<h1>Hello</h1>', function () {
            server.listen(8000);
            done();
        });
    });

    after(function (done) {
        // Remove directory and close connection
        fs.remove(path.join('.', 'output-test', 'index.html'), function () {
            server.close();
            done();
        });
    });

    it('should return 200', function (done) {
        http.get('http://localhost:8000', function (res) {
            assert.equal(res.statusCode, 200);
            done();
        });
    });
});
