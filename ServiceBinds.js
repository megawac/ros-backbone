"use strict";

var Backbone = require("backbone");
var _ = require("lodash");


function createSyncer(method, model, options) {
    var $promise = new Promise(function(resolve, error) {
        var args = {};

        if (method !== "read") {
            _.extend(args, {
                value: model.toJSON()
            });
        }

        model.service.callService(args, resolve, error);
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
