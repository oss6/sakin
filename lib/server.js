'use strict';
var nstatic = require('node-static');
var http = require('http');

module.exports = function (directory) {
    var file = new nstatic.Server(directory);

    return http.createServer(function (request, response) {
        request.addListener('end', function () {
            file.serve(request, response);
        }).resume();
    });
};
