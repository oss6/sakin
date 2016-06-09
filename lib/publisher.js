'use strict';
var fs = require('fs-extra');
var exec = require('child_process').exec;
var path = require('path');
var git = require('simple-git')('output');
var utils = require('./utils');

var x = module.exports;

x.githubPublish = function (settings, cb) {
    fs.stat(path.join('output', '.git'), function (err) {
        // Initialize repo if not already
        if (err && err.code === 'ENOENT') {
            git.init().addRemote('origin', settings.repo);

            if (settings.project) {
                git.checkoutLocalBranch('gh-pages');
            }
        }

        // Add, commit, pull and push
        git.add('.')
            .commit('Site updated at ' + utils.getDate())
            .pull('origin', settings.project ? 'gh-pages' : 'master', function () {
                git.push(['-u', 'origin', settings.project ? 'gh-pages' : 'master'], function () {
                    cb(null);
                });
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
