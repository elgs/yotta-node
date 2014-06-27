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
            syncInterval: 1,
            syncBufferSize: 1000,
            maxDataBufferSize: 1000000
        };
        this.dbPath = path.resolve(dbPath);
        this.dataFile = dbPath + '/data';
        this.indexFile = dbPath + '/index';
        this.lockFile = dbPath + '/.lock';
        this.closed = true;
        this.syncInterval = config.syncInterval || 1;
        this.syncBufferSize = config.syncBufferSize || 1000;
        this.maxDataBufferSize = config.maxDataBufferSize || 1000000;
        mkdirp.sync(this.dbPath);
    };

    Yotta.prototype.open = function () {
        if (fs.existsSync(this.lockFile)) {
            throw new Error('Database is locked.');
        }
        if (this.closed === false) {
            throw new Error('Database already opened.');
        }
        this.dataBuffer = {};
        this.indexBuffer = {};
        this.keySyncBuffer = [];
        fs.openSync(this.lockFile, 'w');
        var fd = fs.openSync(this.indexFile, 'a');
        var indexString = fs.readFileSync(this.indexFile, 'utf8');
        fs.close(fd);
        indexString.split('\n').map(function (val) {
            if (val && val.trim()) {
                var tokens = val.split(',');
                var key = tokens[0];
                var start = tokens[1] >> 0;
                var end = tokens[2] >> 0;
                if (start >= 0 && end >= 0) {
                    this.indexBuffer[key] = {
                        start: start,
                        end: end
                    };
                } else {
                    delete this.dataBuffer[key];
                    delete this.indexBuffer[key];
                }
            }
        }, this);
        var self = this;
        this.syncId = setInterval(function () {
            //console.log('sync...');
            self._syncFull();
        }, this.syncInterval * 1000);
        this.closed = false;
    };

    Yotta.prototype.close = function () {
        clearInterval(this.syncId);
        this._syncFull();
        this._rebuildIndex();
        fs.unlinkSync(this.lockFile);
        this.dataBuffer = null;
        this.indexBuffer = null;
        this.keySyncBuffer = null;
        this.closed = true;
    };

    Yotta.prototype._put = function (key, value) {
        var self = this;
        self.dataBuffer[key] = value;
        self.keySyncBuffer.push(key);
        if (self.keySyncBuffer.length >= self.syncBufferSize) {
            self._syncFull();
            self.keySyncBuffer = [];
        }
    };

    Yotta.prototype.put = function (key, value, cb) {
        var self = this;
        if (typeof cb === 'function') {
            // async
            setImmediate(function () {
                self._put(key, value);
                cb(null);
            });
        } else {
            // sync
            self._put(key, value);
        }
//        precise mode
//        var index = this._syncData(key, value);
//        this.indexBuffer[key] = index;
//        this._syncIndex(key, index);
    };

    Yotta.prototype._get = function (key) {
        var self = this;
        var value = self.dataBuffer[key];
        if (value === undefined) {
            var index = self.indexBuffer[key];
            if (index && index.start >= 0 && index.end >= 0) {
                var length = index.end - index.start;
                var buffer = new Buffer(length);
                var fd = fs.openSync(this.dataFile, 'r');
                fs.readSync(fd, buffer, 0, length, index.start);
                fs.closeSync(fd);
                value = buffer.toString();
                self.dataBuffer[key] = value;
            } else {
                self.dataBuffer[key] = null;
                value = null;
            }
        }
        return value;
    };

    Yotta.prototype.get = function (key, cb) {
        var self = this;
        if (typeof cb === 'function') {
            // async
            setImmediate(function () {
                var ret = self._get(key);
                cb(null, ret);
            });
        } else {
            // sync
            return self._get(key);
        }
    };

    Yotta.prototype._remove = function (key) {
        var self = this;
        delete self.dataBuffer[key];
        delete self.indexBuffer[key];
        fs.appendFileSync(self.indexFile, key + ',-1,-1\n');
    };

    Yotta.prototype.remove = function (key, cb) {
        var self = this;
        if (typeof cb === 'function') {
            // async
            setImmediate(function () {
                self._remove(key);
                cb(null);
            });
        } else {
            // sync
            self._remove(key);
        }
    };

    //test(key, index, array of keys)
    Yotta.prototype.findKeys = function (test, cb) {
        var self = this;
        if (typeof cb === 'function') {
            // async
            setImmediate(function () {
                var ret = Object.keys(self.indexBuffer).filter(test);
                cb(null, ret);
            });
        } else {
            // sync
            return Object.keys(self.indexBuffer).filter(test);
        }
    };

    //test(key, index, array of keys)
    Yotta.prototype.find = function (test, cb) {
        var self = this;
        if (typeof cb === 'function') {
            // async
            setImmediate(function () {
                self.findKeys(test, function (err, keys) {
                    var ret = {};
                    keys.forEach(function (key) {
                        ret[key] = self.get(key);
                    });
                    cb(null, ret);
                });
            });
        } else {
            // sync
            var keys = self.findKeys(test);
            var ret = {};
            keys.forEach(function (key) {
                ret[key] = self.get(key);
            });
            return ret;
        }
    };

    Yotta.prototype.vacuum = function (cb) {
        //TODO:
    };

    Yotta.prototype._syncFull = function () {
        if (!this.keySyncBuffer || this.keySyncBuffer.length === 0) {
            return;
        }
        var fd = fs.openSync(this.dataFile, 'a');
        var size = fs.statSync(this.dataFile).size;
        var self = this;
        var newData = this.keySyncBuffer.reduce(function (previousValue, currentValue) {
            var valueBuffer = new Buffer(self.dataBuffer[currentValue]);
            self.indexBuffer[currentValue] = {
                start: size,
                end: size + valueBuffer.length
            };
            size += valueBuffer.length;
            return previousValue + valueBuffer;
        }, '');
        fs.appendFileSync(this.dataFile, newData);

        var newIndex = this.keySyncBuffer.reduce(function (previousValue, currentValue) {
            var index = self.indexBuffer[currentValue];
            return previousValue + currentValue + ',' + index.start + ',' + index.end + '\n';
        }, '');
        fs.appendFileSync(this.indexFile, newIndex);
        fs.close(fd);
    };

    Yotta.prototype._syncData = function (key, value) {
        var valueBuffer = new Buffer(value);
        var size = fs.statSync(this.dataFile).size;
        fs.appendFileSync(this.dataFile, valueBuffer);
        return {
            start: size,
            end: size + valueBuffer.length - 1
        };
    };

    Yotta.prototype._syncIndex = function (key, index) {
        fs.appendFileSync(this.indexFile, key + ',' + index.start + ',' + index.end + '\n');
    };

    Yotta.prototype._rebuildIndex = function () {
        var indexString = fs.readFileSync(this.indexFile, 'utf8');
        var tmpIndexBuffer = {};
        var tmpIndexBufferString = '';
        indexString.split('\n').map(function (val) {
            if (val && val.trim()) {
                var tokens = val.split(',');
                var key = tokens[0];
                var start = tokens[1] >> 0;
                var end = tokens[2] >> 0;
                if (start >= 0 && end >= 0) {
                    tmpIndexBuffer[key] = val + '\n';
                } else {
                    delete tmpIndexBuffer[key];
                }
            }
        }, this);
        for (var i in tmpIndexBuffer) {
            tmpIndexBufferString += tmpIndexBuffer[i];
        }
        fs.writeFileSync(this.indexFile, tmpIndexBufferString);
    };

    exports.Yotta = Yotta;
})();