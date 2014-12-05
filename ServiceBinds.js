"use strict";

var Backbone = require("backbone");
var _ = require("underscore");


function createSyncer(method, parent, options) {
    var $promise = new Promise(function(resolve, error) {
        var args = {};

        if (method !== "read") {
            _.extend(args, {
                value: this.toJSON()
            });
        }

        this.service.callService(args, resolve, error);
    });
    $promise.then(options.success, options.error);
    return $promise;
}

module.exports = {
    Model: Backbone.Model.extend({
        sync: createSyncer
    }),
    Collection: Backbone.Collection.extend({
        sync: createSyncer
    })
};
