"use strict";

var _ = require("underscore");

var params = {};

function Param(options) {
    if (params[options.name]) return params[options.name];
    else if (!(this instanceof Param)) return new Param(options);
    this.name = options.name;

    params[options.name] = this;
};

Param.prototype.get = function(callback) {
    _.delay(callback, _.random(20, 100), this.value);
};

Param.prototype.set = function(value) {
    this.value = _.clone(value);
};

Param.prototype.delete = function() {
	this.value = void 0;
};

module.exports = _.constant({
    Param: Param
});
