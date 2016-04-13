'use strict';
var nstatic = require('node-static');
var path = require('path');

module.exports = function (directory) {
    var file = new nstatic.Server(path.join('.', directory));

    require('http').createServer(function (request, response) {
        request.addListener('end', function () {
            file.serve(request, response);
        }).resume();
    }).listen(8000);
};
