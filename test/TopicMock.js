var EventEmitter = require("eventemitter2").EventEmitter2;
var util = require("util");

function Topic(options) {
    this.options = options;
}

util.inherits(Topic, EventEmitter);

Topic.prototype.subscribe = function(callback) {
    this.on("message", callback);
};

Topic.prototype.publish = function(message) {
    this.emit("message", message);
};

module.exports = Topic;