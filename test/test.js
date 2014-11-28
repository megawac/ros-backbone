var BBROS = require("../index");
var TopicMock = require("./TopicMock");

var test = require("prova");

function createMock() {
    return new TopicMock({
        name: "/something"
    });
}
test("Throws given poor topic interface", function(t) {
    var myModel = new BBROS.Model();
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
    var mockTopic = createMock();
    var myModel = new BBROS.Model().bind(mockTopic);

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

    t.end();
});

test("Collection with no config", function(t) {
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

    t.end();
});

test("Model with remaps and chosen keys", function(t) {
    var mockTopic = createMock();
    var myModel = new BBROS.Model().bind(mockTopic, {
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

    t.end();
});

test("Header to timestamp transform", function(t) {
    var mockTopic = createMock();
    var myModel = new BBROS.Model().bind(mockTopic, {
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

    t.end();
});

test("transform", function(t) {
    var mockTopic = createMock();
    var myModel = new BBROS.Model().bind(mockTopic, {
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

    t.end();
});
