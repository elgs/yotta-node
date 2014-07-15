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
                p.close();
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
        p.close();
        p.config.rl.close();
    };

    p.use = p.open;

    p.close = function () {
        var args = Array.prototype.slice.call(arguments);
        var vacuum = false;
        if (args && args[0]) {
            vacuum = true;
        }
        if (db) {
            db.close(vacuum);
            db = undefined;
        }
        if (p.context) {
            p.context = '';
        }
        p.config.setPrompt(p.context);
    };

    p.put = function () {
        if (db) {
            var args = Array.prototype.slice.call(arguments);
            db.put(args[0], args[1], function (err) {
                if (err) {
                    console.log(err);
                }
                p.config.setPrompt(p.context);
            });
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };

    p.get = function () {
        if (db) {
            var args = Array.prototype.slice.call(arguments);
            db.get(args[0], function (err, value) {
                console.log(err || value);
                p.config.setPrompt(p.context);
            });
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };

    p.remove = function () {
        if (db) {
            var args = Array.prototype.slice.call(arguments);
            db.remove(args[0], function (err) {
                if (err) {
                    console.log(err);
                }
                p.config.setPrompt(p.context);
            });
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };

    p.findKeys = function () {
        if (db) {
            var args = Array.prototype.slice.call(arguments);
            var ret = db.findKeys(function (key) {
                try {
                    return eval(args[0]);
                } catch (err) {
                    return null;
                }
            });
            console.log(ret);
            p.config.setPrompt(p.context);
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };

    p.findkeys = p.findKeys;

    p.find = function () {
        if (db) {
            var args = Array.prototype.slice.call(arguments);
            var ret = db.find(function (key) {
                try {
                    return eval(args[0]);
                } catch (err) {
                    return null;
                }
            });
            console.log(ret);
            p.config.setPrompt(p.context);
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };

    p.vacuum = function () {
        if (db) {
            var ret = db.vacuum();
            if (ret) {
                console.log(ret);
            }
            p.config.setPrompt(p.context);
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };

    p.stats = function () {
        if (db) {
            console.log(db.stats());
            p.config.setPrompt(p.context);
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };

    p.rebuildValueIndex = function () {
        if (db) {
            var args = Array.prototype.slice.call(arguments);
            var test = null;
            eval('test=' + args[1]);
            db.rebuildValueIndex(args[0], test);
            p.config.setPrompt(p.context);
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };
    p.rebuildvalueindex = p.rebuildValueIndex;

    p.findKeysFromValue = function () {
        if (db) {
            var args = Array.prototype.slice.call(arguments);
            var test = function (value) {
                return eval(args[1]);
            };
            var ret = db.findKeysFromValue(args[0], test);
            console.log(ret);
            p.config.setPrompt(p.context);
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };
    p.findkeysfromvalue = p.findKeysFromValue;

    p.findFromValue = function () {
        if (db) {
            var args = Array.prototype.slice.call(arguments);
            var test = function (value) {
                return eval(args[1]);
            };
            var ret = db.findFromValue(args[0], test);
            console.log(ret);
            p.config.setPrompt(p.context);
        } else {
            console.log('DB is not opened yet.');
            p.config.setPrompt(p.context);
        }
    };
    p.findfromvalue = p.findFromValue;
})();