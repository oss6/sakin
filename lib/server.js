'use strict';
var nstatic = require('node-static');
var http = require('http');

// ..............................................
// :  server.js
// :
// :  Provides a simple static file server.
// ..............................................

module.exports = function (directory) {
    var file = new nstatic.Server(directory);

    return http.createServer((request, response) => {
        request.addListener('end', () => {
            file.serve(request, response);
        }).resume();
    });
};
