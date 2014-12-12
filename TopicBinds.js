"use strict";

// var Topic = require("roslib/src/core/Topic");
var Backbone = require("backbone");
var _ = require("underscore-contrib");

// Convert a header to a timestamp in ms
function headerToTimestamp(header) {
    return header.stamp.secs * 1e3 + header.stamp.nsecs / 1e6;
}

// et vice-versa
function timestampToHeader(timestamp, frame_id) {
    return {
        stamp: {
            secs: Math.floor(timestamp / 1e3),
            nsecs: Math.round((timestamp % 1e3) * 1e6)
        },
        frame_id: frame_id || ""
    };
}

function createBinder(method) {
    return function(topic, options) {
        // if (!(topic instanceof Topic)) {
        //     throw new TypeError("Expected a roslibjs topic");
        // }

        var transform = options && options.transform;
        var self = this;

        // Precompute the tuple (pathToObj, val)
        var bindings = _.map(_.result(options, "bindings"), function(val, key) {
            return [_.keysFromPath(key), val];
        });
        var bindingsLength = bindings.length;

        var headerTimestamp = _.result(options, "headerTimestamp");
        if (headerTimestamp) {
            // Apply a default if not specified
            _.defaults(headerTimestamp, ["timestamp", "header"]);
        }

        function listener(_message) {
            var message;
            if (bindingsLength) {
                message = {};
                for (var i = 0; i < bindingsLength; i++) {
                    var binding = bindings[i];
                    var path = binding[0];
                    message[binding[1]] = path.length > 1 ? _.getPath(_message, path) : _message[path];
                }
            } else {
                message = _message;
            }

            if (headerTimestamp) {
                var column = headerTimestamp[1] || "header";
                message[headerTimestamp[0]] = headerToTimestamp(message[column] || _message[column]);
            }

            if (transform) {
                message = transform.call(self, message);
            }

            // TODO: override with a optimized version with a known message
            if (message) {
                self[method](message);
            }
        }

        // TFClient (note _.has throws for null in <1.7)
        if (_.result(options, "observeFrame") != null) {
            topic.subscribe(options.observeFrame, listener);
        } else {
            // Topic or ActionClient
            topic.subscribe(listener);
        }

        return _.extend(this, {
            _topic: topic,
            _topicOptions: options
        });
    };
}

function destroy() {
    return new Promise(function(resolve) {
        _.result(this._topic, "unsubscribe");
        _.result(this._topic, "unadvertise");
        resolve();
    });
}

var Model = Backbone.Model.extend({
    bind: createBinder("set"),

    // If you pick keys or make this model a topic sink
    // then your on your own
    sync: function(method, model, options) {
        // Will nearly always be "create"
        if (!_.contains(["create", "update", "patch"], method)) {
            throw new TypeError("Method " + method + " isn't implemented");
        }
        options = _.extend({}, options, this._topicOptions);
        var headerTimestamp = _.result(options, "headerTimestamp");
        var json = model.toJSON();
        if (headerTimestamp) {
            json[headerTimestamp[1]] = timestampToHeader(_.result(options, "timestamp") || _.now(), _.result(options, "frame_id"));
            delete json[headerTimestamp[0]];
        }
        if (_.isFunction(options.publishTransform)) {
            json = options.publishTransform.call(model, json, options);
        }
        if (json) {
            _.each(options.bindings, function(key, topicKey) {
                json[topicKey] = json[key];
                delete json[key];
            });
            this._topic.publish(json);
        }
        return new Promise(function(resolve) {
            options.success.call(model, model.attributes);
            resolve(model.attributes);
        });
    },
    destroy: destroy
});

var Collection = Backbone.Collection.extend({
    bind: createBinder("add"),
    destroy: destroy
});

module.exports = {
    Model: Model,
    Collection: Collection
};
