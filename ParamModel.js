"use strict";

var Backbone = require("backbone");
var _ = require("underscore");

function makeParam(ros, param) {
    return ros.Param({
        name: param
    });
}

// I hate Backbone.sync :<
function readParams(model) {
    return Promise.all(_.map(model.params, function(name) {
        return new Promise(function(resolve) {
            return makeParam(model.ros, name).get(function(val){
                resolve([name, val]);
            });
        });
    })).then(function(paramPairs) {
        model.set(_.object(paramPairs));

        model.set(model.reduce(function(memo, val, key) {
            // Strip prefix
            memo[unprefix(key)] = val;
            return memo;
        }, {}));

        return model.attributes;
    });
}

function unprefix(key) {
    var idx = key.lastIndexOf("/");
    return idx >= 0 ? key.slice(idx + 1) : key;
}

function deleteParams(model) {
    return new Promise(function(resolve) {
        _.each(model.attributes, function(val, param) {
            makeParam(model.ros, param).delete();
        });
        resolve(model.toJSON());
    });
}

function updateParams(model) {
    return new Promise(function(resolve) {
        _.each(model.params, function(name) {
            var val = model.attributes[name];
            var param = makeParam(model.ros, name);
            if (val == null) param.delete();
            else param.set(val);
        });
        resolve(model.toJSON());
    });
}

var funcMap = {
    read: readParams,
    delete: deleteParams
};
 
var ParamModel = Backbone.Model.extend({
    defaults: {},
    params: [/* node/param1, node2/param */],
    /* ros: new ROS.Ros({url: "ws://localhost:9091"}) */
    sync: function(method, model, options) {
        var fn = funcMap[method] || updateParams,
            $promise = fn(model, options);
        $promise.then(options.success, options.error);
        return $promise;        
    }
});

module.exports = ParamModel;
