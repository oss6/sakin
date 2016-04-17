'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = ActionObservable;

function ActionObservable(silent) {
    EventEmitter.call(this);
    this.silent = silent;
}

util.inherits(ActionObservable, EventEmitter);

ActionObservable.prototype.log = function (type, text) {
    if (!this.silent) {
        this.emit('log', type, text);
    }
};
