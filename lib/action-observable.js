'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = ActionObservable;

function ActionObservable() {
    EventEmitter.call(this);
}

util.inherits(ActionObservable, EventEmitter);

ActionObservable.prototype.log = function (type, text) {
    this.emit('log', type, text);
};
