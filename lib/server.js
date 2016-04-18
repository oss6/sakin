'use strict';
var nstatic = require('node-static');
var path = require('path');
var http = require('http');

module.exports = function (directory) {
    var file = new nstatic.Server(path.join('.', directory));

    return http.createServer(function (request, response) {
        request.addListener('end', function () {
            file.serve(request, response);
        }).resume();
    });
};
