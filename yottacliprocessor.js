/**
 * Created by elgs on 7/1/14.
 */

(function () {
    "use strict";

    var yotta = require('./yotta.js');

    var p = {
        context: ''
    };
    module.exports = p;

    p.test = function () {
        console.log(Array.prototype.slice.call(arguments));
    };

    p.use = function () {
        var args = Array.prototype.slice.call(arguments);
        p.context = args[0];
    };

    p.close = function () {
    };

    p.put = function () {
    };

    p.get = function () {
    };

    p.remove = function () {
    };

    p.vacuum = function () {
    };
})();