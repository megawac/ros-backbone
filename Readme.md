Simple Backbone model and collection bindings to a ROS Topic

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
        "some-other-attr": "xyz"
    },

    // Covert a stamped ROS header to a JS timestamp in MS (useful for time series)
    // Syntax: [<model attribute>, <topic attribute (default: "header")>]
    headerTimestamp: ["timestamp"],

    transform: function(message) {
        message.foo = 1;
        return message.bar < 5 ? message : false; // don't emit message
    }
});


var myCollection = new rosbb.Collection();
myCollection.bind(myTopic, {
    // options (see above)
});
```
