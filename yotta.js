/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var fs = require('fs');

    var Yotta = function (dbPath, config) {
        config = config || {
            read: true,
            write: true
        };
        this.dbPath = dbPath;
        this.read = config.read || true;
        this.write = config.write || true;
        this.closed = true;
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath);
        }
    };

    Yotta.prototype.open = function () {
        if (fs.existsSync(this.dbPath + '/.lock')) {
            throw new Error('Database is locked.');
        }
        if (this.closed === false) {
            throw new Error('Database already opened.');
        }
        fs.openSync(this.dbPath + '/.lock', 'w');
        this.closed = false;
    };

    Yotta.prototype.close = function () {
        fs.unlinkSync(this.dbPath + '/.lock');
        this.closed = true;
    };

    Yotta.prototype.put = function (key, value) {
    };

    Yotta.prototype.get = function (key) {
    };

    module.exports = Yotta;
})();