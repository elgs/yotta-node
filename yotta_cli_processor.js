/**
 * Created by elgs on 7/2/14.
 */

(function () {
    "use strict";

    var Yotta = require('./yotta.js').Yotta;

    var p = {};
    module.exports = p;

    p.put = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var fnParams = args[1]; // array
        var db = new Yotta(dbName);
        db.open();
        db.put(fnParams[0], fnParams[1]);
        db.close();
    };

    p.get = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var fnParams = args[1]; // array
        var db = new Yotta(dbName);
        db.open();
        var ret = db.get(fnParams[0]);
        db.close();
        return ret;
    };

    p.remove = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var fnParams = args[1]; // array
        var db = new Yotta(dbName);
        db.open();
        db.remove(fnParams[0]);
        db.close();
    };

    p.findKeys = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var fnParams = args[1]; // array
        var db = new Yotta(dbName);
        db.open();
        var ret = db.findKeys(function (key) {
            try {
                return eval(fnParams[0]);
            } catch (err) {
                return null;
            }
        });
        db.close();
        return ret;
    };

    p.findkeys = p.findKeys;

    p.find = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var fnParams = args[1]; // array
        var db = new Yotta(dbName);
        db.open();
        var ret = db.find(function (key) {
            try {
                return eval(fnParams[0]);
            } catch (err) {
                return null;
            }
        });
        db.close();
        return ret;
    };

    p.vacuum = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var db = new Yotta(dbName);
        db.open();
        db.vacuum();
        db.close();
    };

    p.stats = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var db = new Yotta(dbName);
        db.open();
        console.log(db.stats());
        db.close();
    };

    // yotta a rebuildValueIndex length value.length
    p.rebuildValueIndex = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var fnParams = args[1]; // array
        var db = new Yotta(dbName);
        db.open();
        var test = function (value) {
            return eval(fnParams[1]);
        };
        db.rebuildValueIndex(fnParams[0], test);
        db.close();
    };
    p.rebuildvalueindex = p.rebuildValueIndex;

    p.findKeysFromValue = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var fnParams = args[1]; // array
        var db = new Yotta(dbName);
        db.open();
        var test = function (value) {
            return eval(fnParams[1]);
        };
        var ret = db.findKeysFromValue(fnParams[0], test);
        console.log(ret);
        db.close();
    };
    p.findkeysfromvalue = p.findKeysFromValue;

    p.findFromValue = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0]; // string
        var fnParams = args[1]; // array
        var db = new Yotta(dbName);
        db.open();
        var test = function (value) {
            return eval(fnParams[1]);
        };
        var ret = db.findFromValue(fnParams[0], test);
        console.log(ret);
        db.close();
    };
    p.findfromvalue = p.findFromValue;
})();