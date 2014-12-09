Backbone bindings to a ROSLib  [![Build Status](https://travis-ci.org/megawac/ros-backbone.svg?branch=master)](https://travis-ci.org/megawac/ros-backbone)
========

# Parameter model

Simple `fetch`, `update`, `delete` bindings for `Model` -> `Param`

```js
var rosbb = require("ros-backbone");

var ParamModel = rosbb.ParamModel.extend({
    ros: new ROS.Ros({
        url: "ws://localhost:9091"
    }),
    params: ["/foo", "/bar"]
});

var paramModel = new ParamModel();

paramModel.fetch().then(() => {
   app.doSomething(); 
});
```

**Note**: this part of the module requires ES6 promises, if you want to support Node (0.10) or [some browsers](caniuse.com/promises) [use a polyfill](https://github.com/getify/native-promise-only/blob/master/lib/npo.src.js)

```js
// Browserify
global.Promise = require("native-promise-only");
// Node
GLOBAL.Promise = require("native-promise-only");
```

# Topic Model/Collection

```js
var rosbb = require("ros-backbone");

var ROS = require("roslib");
var ros = ROS.Ros("ws://localhost:9090");

var myTopic = ros.Topic({
	name: "/some/topic"
});

var myModel = new rosbb.Model();
myModel.bind(myTopic, {
    // If not provided all fields will be kept
    bindings: {
        "topic-attribute": "mapped-model-attribute",
        "some-other-attr": "xyz",

        // Dots and bracket notation will be transformed
        // and the path will be found, however the other way
        // around doesn't currently work
        "pose.position.y" : "lat",
        "pose.position.x": "lng"
    },

    // Covert a stamped ROS header to a JS timestamp in MS (useful for time series)
    // Syntax: [<model attribute>, <topic attribute (default: "header")>]
    headerTimestamp: ["timestamp"],

    transform: function(message) {
        message.foo = 1;
        return message.bar < 5 ? message : false; // don't emit message
    },

    publishTransform: function(message) {
        // return falsey to omit, otherwise transform? & return the message to publish
    },

    // If you want to use a TFClient and provide a TFClient instance to bind
    frame_id: "odom_frame"

});

// publish a ROS message
myModel.save({
    a: 1, b: 2, c: 3
});

var myCollection = new rosbb.Collection();
myCollection.bind(myTopic, {
    // options (see above)
});
```

## Notes

- Subscribe to as many ROS Topics as you please, but you should use the model as a sink and uni-directional in that case
- This works best as a subscriber, publishing can be sketchy if you rebind/filter keys or subscribe to multiple nodes