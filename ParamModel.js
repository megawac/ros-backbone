"use strict";

var Backbone = require("backbone");
var _ = require("underscore");

function makeParam(ros, param) {
    return ros.Param({
        name: param
    });
}
 
var ParamModel = Backbone.Model.extend({
    defaults: {},
    params: [/* node/param1, node2/param */],
    /* ros: new ROS.Ros({url: "ws://localhost:9091"}) */
    sync: function(method, model, options) {
        var self = this, $promise;
        switch (method) {
            case "read": 
                $promise = Promise.all(_.map(self.params, function(name) {
                    return new Promise(function(resolve) {
                        return makeParam(self.ros, name).get(function(val){
                            resolve([name, val]);
                        });
                    });
                })).then(function(paramPairs) {
                    return self.set(_.object(paramPairs)).attributes;
                });
                break;
            case "delete":
                $promise = new Promise(function(resolve) {
                    _.each(self.attributes, function(val, param) {
                        makeParam(self.ros, param).delete();
                    });
                    resolve(self.toJSON());
                });
                break;
            default:
                $promise = new Promise(function(resolve) {
                    _.each(self.params, function(param) {
                        var val = self.attributes[param];
                        var param = makeParam(self.ros, param);
                        if (val == void 0) param.delete();
                        else param.set(val);
                    });
                    resolve(self.toJSON());
                });
        }
        $promise.then(options.success, options.error);
        return $promise;        
    }
});

module.exports = ParamModel;
