/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var fs = require('fs');
    var path = require('path');

    var Yotta = function (dbPath, config) {
        config = config || {
            read: true,
            write: true
        };
        this.dbPath = path.resolve(dbPath);
        this.dataFile = dbPath + '/+data';
        this.indexFile = dbPath + '/index';
        this.lockFile = dbPath + '/.lock';
        this.read = config.read || true;
        this.write = config.write || true;
        this.closed = true;
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath);
        }
    };

    var Record = function (value) {
        this.value = value;
    };

    Yotta.prototype.open = function () {
        if (fs.existsSync(this.lockFile)) {
            throw new Error('Database is locked.');
        }
        if (this.closed === false) {
            throw new Error('Database already opened.');
        }
        fs.openSync(this.lockFile, 'w');
        this.closed = false;
    };

    Yotta.prototype.close = function () {
        fs.unlinkSync(this.lockFile);
        this.closed = true;
    };

    Yotta.prototype.put = function (key, value) {
        var record = new Record(value);
        record.createTime = new Date();
        this.putRecord(key, record);
    };

    Yotta.prototype.putRecord = function (key, record) {

    };

    Yotta.prototype.get = function (key) {
        return this.getRecord(key).value;
    };

    Yotta.prototype.getRecord = function (key) {
    };

    Yotta.prototype.remove = function (key) {
    };

    exports.Yotta = Yotta;
    exports.Record = Record;
})();