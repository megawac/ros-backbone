"use strict";

var BBROS = require("../index");
var TopicMock = require("./TopicMock");
var _ = require("underscore");

var test = require("prova");

var TestingModel = BBROS.Model.extend({
    isNew: function() {
        return false;
    }
});

function createMock() {
    return new TopicMock({
        name: "/something"
    });
}

test("Throws given poor topic interface", function(t) {
    var myModel = new TestingModel();
    var myCollection = new BBROS.Collection();
    t.throws(function() {
        myModel.bind({}, {
            bindings: {}
        });
    });
    t.throws(function() {
        myCollection.bind({}, {
            bindings: {}
        });
    });
    t.end();
});

test("Model with no config", function(t) {
    t.plan(2);

    var mockTopic = createMock();
    var myModel = new TestingModel().bind(mockTopic);

    mockTopic.publish({
        a: 1, b: 2, c: 3
    });

    t.deepEqual(myModel.toJSON(), {
        a: 1, b: 2, c: 3
    });

    mockTopic.publish({
        a: 1, b: 5, c: 6
    });

    t.deepEqual(myModel.toJSON(), {
        a: 1, b: 5, c: 6
    });
});

test("Collection with no config", function(t) {
    t.plan(1);

    var mockTopic = createMock();
    var myCollection = new BBROS.Collection().bind(mockTopic);

    mockTopic.publish({
        a: 1, b: 2, c: 3
    });
    mockTopic.publish({
        a: 4, b: 5, c: 6
    });

    t.deepEqual(myCollection.toJSON(), [
        {a: 1, b: 2, c: 3},
        {a: 4, b: 5, c: 6}
    ]);
});

test("Model with remaps and chosen keys", function(t) {
    t.plan(1);

    var mockTopic = createMock();
    var myModel = new TestingModel().bind(mockTopic, {
        bindings: {
            "pose.position.y" : "lat",
            "pose.position.x": "lng"
        }
    });

    mockTopic.publish({
        pose: {
            position: {
                x: 5,
                y: 1
            }
        }
    });

    t.deepEqual(myModel.toJSON(), {
        lat: 1, lng: 5
    });
});

test("Dot notation remaps", function(t) {
    t.plan(1);

    var mockTopic = createMock();
    var myModel = new TestingModel().bind(mockTopic, {
        bindings: {
            a: "x",
            b: "y"
        }
    });

    mockTopic.publish({
        a: 1, b: 2, c: 3
    });

    t.deepEqual(myModel.toJSON(), {
        x: 1, y: 2
    });
});

test("Header to timestamp transform (defaults)", function(t) {
    t.plan(1);

    var mockTopic = createMock();
    var myModel = new TestingModel().bind(mockTopic, {
        bindings: {
            a: "a"
        },
        headerTimestamp: ["timestamp"]
    });

    mockTopic.publish({
        header: {
            seq: 11,
            stamp: {
                secs: 2e9,
                nsecs: 4e8
            }
        },
        a: 1, b: 2, c: 3
    });

    t.deepEqual(myModel.toJSON(), {
        a: 1,
        timestamp: 2e12 + 400
    });
});

test("Header to timestamp transform (non defaults)", function(t) {
    t.plan(1);

    var mockTopic = createMock();
    var myModel = new TestingModel().bind(mockTopic, {
        bindings: {
            a: "a"
        },
        headerTimestamp: ["t", "h"]
    });

    mockTopic.publish({
        h: {
            seq: 11,
            stamp: {
                secs: 2e9,
                nsecs: 4e8
            }
        },
        a: 1, b: 2, c: 3
    });

    t.deepEqual(myModel.toJSON(), {
        a: 1,
        t: 2e12 + 400
    });
});

test("transform", function(t) {
    t.plan(2);

    var mockTopic = createMock();
    var myModel = new TestingModel().bind(mockTopic, {
        transform: function(message) {
            message.x = "foo";
            return message.a === 1 ? message : null;
        }
    });

    mockTopic.publish({
        a: 1, b: 2
    });

    t.deepEqual(myModel.toJSON(), {
        a: 1, b: 2, x: "foo"
    });

    mockTopic.publish({
        a: 2, b: 4
    });

    t.deepEqual(myModel.toJSON(), {
        a: 1, b: 2, x: "foo"
    });
});

test("saving a simple model", function(t) {
    t.plan(1);

    var mockTopic = createMock();
    var myModel = new TestingModel({c: 3}).bind(mockTopic);

    mockTopic.subscribe(function(message) {
        t.deepEqual(message, {
            a: 1, b: 2, c: 3
        });
    });

    myModel.save({
        a: 1, b: 2
    });
});

test("publish transform", function(t) {
    t.plan(2);

    var mockTopic = createMock();
    var myModel = new TestingModel({c: 3}).bind(mockTopic, {
        publishTransform: function(message) {
            return _.pick(message, "a", "c");
        }
    });

    mockTopic.subscribe(function(message) {
        t.deepEqual(message, {
            a: 1, c: 3
        });
    });

    myModel.save({
        a: 1, b: 2
    })
    .then(function(attributes) {
        t.deepEqual(attributes, {
            a: 1, b: 2, c: 3
        });
    });
});

test("inverts picks and js timestamps -> header", function(t) {
    t.plan(1);

    var mockTopic = createMock();
    var myModel = new TestingModel().bind(mockTopic, {
        bindings: {
            a: "x"
        },
        headerTimestamp: ["t", "h"],
        frame_id: "frame"
    });

    mockTopic.subscribe(function(message) {
        delete message.h.seq;
        t.deepEqual(message, {
            h: {
                stamp: {
                    secs: 2e9,
                    nsecs: 4e8
                },
                frame_id: "frame"
            },
            a: 1, b: 2, c: 3
        });
    });

    myModel.set("x", 1);
    myModel.save({
        b: 2,
        c: 3
    }, {
        timestamp: 2e12 + 400
    });
});
