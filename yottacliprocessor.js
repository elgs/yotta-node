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
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        console.log(Array.prototype.slice.call(arguments));
        config.setPrompt(p.context);
    };

    p.open = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
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
        config.setPrompt(p.context);
    };

    p.exit = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        p.close(config);
        config.rl.close();
    };

    p.use = p.open;

    p.close = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        if (db) {
            db.close();
            db = undefined;
        }
        if (p.context) {
            p.context = '';
        }
        config.setPrompt(p.context);
    };

    p.put = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        if (db) {
            db.put(args[0], args[1], function (err) {
                if (err) {
                    console.log(err);
                }
                config.setPrompt(p.context);
            });
        }
    };

    p.get = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        if (db) {
            db.get(args[0], function (err, value) {
                console.log(err || value);
                config.setPrompt(p.context);
            });
        }
    };

    p.remove = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        if (db) {
            db.remove(args[0], function (err) {
                if (err) {
                    console.log(err);
                }
                config.setPrompt(p.context);
            });
        }
    };

    p.findKeys = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        if (db) {
            var ret = db.findKeys(function (key) {
                return eval(args[0]);
            });
            console.log(ret);
            config.setPrompt(p.context);
        }
    };

    p.find = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        if (db) {
            var ret = db.find(function (key) {
                return eval(args[0]);
            });
            console.log(ret);
            config.setPrompt(p.context);
        }
    };

    p.vacuum = function () {
        var args = Array.prototype.slice.call(arguments);
        var config = args[args.length - 1];
        if (db) {
            db.vacuum(function (err) {
                if (err) {
                    console.log(err);
                }
                config.setPrompt(p.context);
            });
        }
    };
})();