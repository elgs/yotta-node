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

    p.open = function () {
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
            p.close();
        }
        p.context = dbName;
        db = new Yotta(p.context);
        db.open();
    };

    p.close = function () {
        if (db) {
            db.close();
            db = undefined;
        }
        if (p.context) {
            p.context = undefined;
        }
    };

    p.put = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            db.put(args[0], args[1]);
        }
    };

    p.get = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            console.log(db.get(args[0]));
        }
    };

    p.remove = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            db.remove(args[0]);
        }
    };

    p.vacuum = function () {
        if (db) {
            db.vacuum();
        }
    };
})();