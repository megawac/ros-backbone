"use strict";

var TopicBinds = require("./TopicBinds");
var ServiceBinds = require("./ServiceBinds");

module.exports = {
    Model: TopicBinds.Model,
    Collection: TopicBinds.Collection,

    ParamModel: require("./ParamModel"),
    
    ServiceModel: ServiceBinds.Model,
    ServiceCollection: ServiceBinds.Collection
};
