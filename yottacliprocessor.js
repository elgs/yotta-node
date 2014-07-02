/**
 * Created by elgs on 7/1/14.
 */

(function () {
    "use strict";

    var Yotta = require('./yotta.js').Yotta;
    var db;

    var p = {
        context: '',
        config: null
    };
    module.exports = p;

    p.test = function () {
        console.log(Array.prototype.slice.call(arguments));
        p.config.setPrompt(p.context);
    };

    p.open = function () {
        var args = Array.prototype.slice.call(arguments);
        var dbName = args[0];
        if (dbName === p.context) {
            p.config.setPrompt(p.context);
            return;
        }
        try {
            if (!dbName) {
                db.close();
                p.context = dbName;
                p.config.setPrompt(p.context);
                return;
            }
            if (db) {
                p.close(p.config);
            }
            p.context = dbName;
            db = new Yotta(p.context);
            db.open();
        } catch (err) {
            p.context = '';
            db = null;
            console.log(err);
        }
        p.config.setPrompt(p.context);
    };

    p.exit = function () {
        p.close(p.config);
        p.config.rl.close();
    };

    p.use = p.open;

    p.close = function () {
        if (db) {
            db.close();
            db = undefined;
        }
        if (p.context) {
            p.context = '';
        }
        p.config.setPrompt(p.context);
    };

    p.put = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            db.put(args[0], args[1], function (err) {
                if (err) {
                    console.log(err);
                }
                p.config.setPrompt(p.context);
            });
        }
    };

    p.get = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            db.get(args[0], function (err, value) {
                console.log(err || value);
                p.config.setPrompt(p.context);
            });
        }
    };

    p.remove = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            db.remove(args[0], function (err) {
                if (err) {
                    console.log(err);
                }
                p.config.setPrompt(p.context);
            });
        }
    };

    p.findkeys = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            var ret = db.findKeys(function (key) {
                try {
                    return eval(args[0]);
                } catch (err) {
                    return null;
                }
            });
            console.log(ret);
            p.config.setPrompt(p.context);
        }
    };

    p.find = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            var ret = db.find(function (key) {
                try {
                    return eval(args[0]);
                } catch (err) {
                    return null;
                }
            });
            console.log(ret);
            p.config.setPrompt(p.context);
        }
    };

    p.vacuum = function () {
        var args = Array.prototype.slice.call(arguments);
        if (db) {
            db.vacuum(function (err) {
                if (err) {
                    console.log(err);
                }
                p.config.setPrompt(p.context);
            });
        }
    };
})();