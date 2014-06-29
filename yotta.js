/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var fs = require('fs');
    var path = require('path');
    var mkdirp = require('mkdirp');
    var rimraf = require('rimraf');
    var _ = require('lodash');

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
        fd = fs.openSync(this.dataFile, 'a');
        fs.close(fd);
        indexString.split('\n').map(function (val) {
            if (val && val.trim()) {
                var tokens = val.split(',');
                var key = tokens[0];
                var start = tokens[1] >> 0;
                var length = tokens[2] >> 0;
                if (start >= 0 && length >= 0) {
                    this.indexBuffer[key] = {
                        start: start,
                        length: length
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
        this._rebuildIndex(true);
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
            if (index && index.start >= 0 && index.length >= 0) {
                var length = index.length;
                var buffer = new Buffer(length);
                var fd = fs.openSync(this.dataFile, 'r');
                fs.readSync(fd, buffer, 0, length, index.start);
                fs.closeSync(fd);
                value = buffer.toString();
                self.dataBuffer[key] = value;
            } else {
                value = undefined;
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
        var i = self.keySyncBuffer.indexOf(key);
        if (i > -1) {
            self.keySyncBuffer.splice(i, 1);
        }
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
                var retIndex = Object.keys(self.indexBuffer).filter(test);
                var retData = Object.keys(self.dataBuffer).filter(test);
                cb(null, _.unique(retIndex.concat(retData)));
            });
        } else {
            // sync
            var retIndex = Object.keys(self.indexBuffer).filter(test);
            var retData = Object.keys(self.dataBuffer).filter(test);
            return _.unique(retIndex.concat(retData));
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

    Yotta.prototype._vacuum = function () {
        var self = this;
        self._syncFull();
        var tmpVacuumDb = new Yotta(self.dbPath + '/.tmpVacuumDb');
        tmpVacuumDb.open();
        for (var key in self.indexBuffer) {
            var value = self.get(key);
            tmpVacuumDb.put(key, value);
        }
        tmpVacuumDb.close();
        fs.writeFileSync(self.dbPath + '/data', fs.readFileSync(self.dbPath + '/.tmpVacuumDb/data'));
        fs.writeFileSync(self.dbPath + '/index', fs.readFileSync(self.dbPath + '/.tmpVacuumDb/index'));
        rimraf.sync(self.dbPath + '/.tmpVacuumDb');
        self._rebuildIndex(false);
    };

    Yotta.prototype.vacuum = function (cb) {
        var self = this;
        if (typeof cb === 'function') {
            // async
            setImmediate(function () {
                self._vacuum();
                cb(null);
            });
        } else {
            // sync
            self._vacuum();
        }
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
                length: valueBuffer.length
            };
            size += valueBuffer.length;
            return previousValue + valueBuffer;
        }, '');
        fs.appendFileSync(this.dataFile, newData);

        var newIndex = this.keySyncBuffer.reduce(function (previousValue, currentValue) {
            var index = self.indexBuffer[currentValue];
            return previousValue + currentValue + ',' + index.start + ',' + index.length + '\n';
        }, '');
        fs.appendFileSync(this.indexFile, newIndex);
        fs.close(fd);
        this.keySyncBuffer = [];
    };

    Yotta.prototype._syncData = function (key, value) {
        var valueBuffer = new Buffer(value);
        var size = fs.statSync(this.dataFile).size;
        fs.appendFileSync(this.dataFile, valueBuffer);
        return {
            start: size,
            length: valueBuffer.length
        };
    };

    Yotta.prototype._syncIndex = function (key, index) {
        fs.appendFileSync(this.indexFile, key + ',' + index.start + ',' + index.length + '\n');
    };

    Yotta.prototype._rebuildIndex = function (writeBack) {
        var indexString = fs.readFileSync(this.indexFile, 'utf8');
        this.indexBuffer = {};
        var tmpIndexBufferString = '';
        indexString.split('\n').map(function (val) {
            if (val && val.trim()) {
                var tokens = val.split(',');
                var key = tokens[0];
                var start = tokens[1] >> 0;
                var length = tokens[2] >> 0;
                if (start >= 0 && length >= 0) {
                    this.indexBuffer[key] = val + '\n';
                } else {
                    delete this.indexBuffer[key];
                }
            }
        }, this);
        if (writeBack) {
            for (var i in this.indexBuffer) {
                tmpIndexBufferString += this.indexBuffer[i];
            }
            fs.writeFileSync(this.indexFile, tmpIndexBufferString);
        }
    };

    exports.Yotta = Yotta;
})();