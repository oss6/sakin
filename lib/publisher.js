'use strict';
var fs = require('fs-extra');
var exec = require('child_process').exec;
var path = require('path');
var git = require('simple-git')('output');

var x = module.exports;

x.githubPublish = function (settings, cb) {
    fs.stat(path.join('output', '.git'), function (err) {
        if (err && err.code === 'ENOENT') {
            git.init().addRemote('origin', settings.repo);
        }

        git.pull()
            .add('.')
            .commit('')
            .push(['-u', 'origin', 'master'], function () {
                cb(null);
            });
    });
};

x.rsyncPublish = function (settings, cb) {
    exec('rsync -az --force --delete --progress -e "ssh -p22" ./output ' + settings.user + '@' + settings.server + ':' + settings.location, function (error) {
        cb(error);
    });
};

x.publish = function (publishSettings, cb) {
    var fnName = publishSettings.medium + 'Publish';

    if (x[fnName] === undefined) {
        cb('The specified medium is not supported');
    } else {
        x[fnName](publishSettings[publishSettings.medium], cb);
    }
};
