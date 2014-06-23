/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var fs = require('fs');
    var path = require('path');
    var mkdirp = require('mkdirp');

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
        this.dataBuffer = {};
        this.indexBuffer = {};
        this.syncClean = true;
        mkdirp.sync(this.dbPath);
    };

    Yotta.prototype.open = function () {
        if (fs.existsSync(this.lockFile)) {
            throw new Error('Database is locked.');
        }
        if (this.closed === false) {
            throw new Error('Database already opened.');
        }
        fs.openSync(this.lockFile, 'w');
        fs.openSync(this.indexFile, 'a');
        var indexString = fs.readFileSync(this.indexFile, 'utf8');
        this.indexBuffer = JSON.parse(indexString || '{}');
        this.closed = false;
    };

    Yotta.prototype.close = function () {
        this.syncClean = false;
        this._syncBuffer();
        fs.unlinkSync(this.lockFile);
        this.closed = true;
    };

    Yotta.prototype.put = function (key, value) {
        this.dataBuffer[key] = value;
        this.indexBuffer[key] = null;
    };

    Yotta.prototype.get = function (key) {
        var value = this.dataBuffer[key];
        if (!value) {
            var index = this.indexBuffer[key];
            var dataStream = fs.createReadStream(this.dataFile, index);
            value = dataStream.read().toSource();
            this.dataBuffer[key] = value;
        }
        return value;
    };

    Yotta.prototype.remove = function (key) {
        delete this.dataBuffer[key];
        delete this.indexBuffer[key];
    };

    Yotta.prototype.vacuum = function () {
    };

    Yotta.prototype._syncBuffer = function () {
        this.syncClean = true;
    };

    exports.Yotta = Yotta;
})();