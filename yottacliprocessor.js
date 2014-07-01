/**
 * Created by elgs on 7/1/14.
 */

(function () {
    "use strict";

    var Yotta = require('./yotta.js').Yotta;
    var db;

    var p = {
        context: ''
    };
    module.exports = p;

    p.test = function () {
        console.log(Array.prototype.slice.call(arguments));
    };

    p.use = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0];
        if (dbName === p.context) {
            return;
        }
        if (!dbName) {
            db.close();
            p.context = dbName;
            return;
        }
        if (db) {
            db.close();
        }
        p.context = dbName;
        db = new Yotta(p.context);
        db.open();
    };

    p.close = function () {
        if (p.context) {
            db.close();
        }
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