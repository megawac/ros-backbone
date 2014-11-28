"use strict";

// var Topic = require("roslib/src/core/Topic");
var Backbone = require("backbone");
var _ = require("underscore");

// Convert a header to a timestamp in ms
function headerToTimestamp(header) {
    return header.stamp.secs * 1e3 + header.stamp.nsecs / 1e6;
}

function createBinder(method) {
    return function(topic, options) {
        // if (!(topic instanceof Topic)) {
        //     throw new TypeError("Expected a roslibjs topic");
        // }

        var bindings = _.result(options, "bindings");
        var headerTimestamp = _.result(options, "headerTimestamp");
        var transform = options && options.transform;
        var self = this;
        // We can expect messages to not change
        var keys;
        topic.subscribe(function(_message) {
            var message;
            if (bindings) {
                keys = keys || _.keys(_message);
                message = {};
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    if (bindings[key] != null) {
                        message[bindings[key]] = _message[key];
                    }
                }
            } else {
                message = _message;
            }

            if (headerTimestamp) {
                var column = headerTimestamp[1] || "header";
                message[headerTimestamp[0]] = headerToTimestamp(message[column] || _message[column]);
            }

            if (transform) {
                console.log("message", message);
                message = transform.call(self, message);
            }

            // TODO: override with a optimized version with a known message
            if (message) {
                self[method](message);
            }
        });
        return this;
    };
}

var Model = Backbone.Model.extend({
    bind: createBinder("set")
});

var Collection = Backbone.Collection.extend({
    bind: createBinder("add")
});

module.exports = {
    Model: Model,
    Collection: Collection
};