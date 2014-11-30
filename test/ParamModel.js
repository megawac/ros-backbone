"use strict";

var test = require("prova");
global.Promise = require("native-promise-only");

var ParamMock = require("./RosParamMock");
var ParamModel = require("../ParamModel");

var Model = ParamModel.extend({
    ros: new ParamMock(),
    params: ["/foo", "/bar", "/test/list"]
});
var model = new Model();

var Model2 = ParamModel.extend({
    ros: new ParamMock(),
    params: ["/foo", "/bar"]
});
var model2 = new Model2();

test("Model save", function(t) {
    t.plan(1);

    model.save({
        "/foo": 1,
        "/bar": 2,
        "/test/list": 3
    }).then(function(status) {
        t.deepEqual(status, {
            "/foo": 1,
            "/bar": 2,
            "/test/list": 3
        });
    }, t.fail);
});

test("Model unsetting", function(t) {
    t.plan(1);

    model.unset("/foo")
    .save().then(function(status) {
        t.deepEqual(status, {
            "/bar": 2,
            "/test/list": 3
        });
    }, t.fail);
});


test("Model fetching", function(t) {
    t.plan(4);

    model2.fetch().then(function(status) {
        t.equal(status["/bar"], 2);
        t.equal(model2.get("/bar"), 2);
        t.equal(status["/foo"], undefined);
        t.equal(model2.get("/foo"), undefined);
    }, t.fail);
});
