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
        this.dataFile = this.dbPath + '/data';
        this.indexFile = this.dbPath + '/index';
        this.lockFile = this.dbPath + '/.lock';
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
        var fd = fs.openSync(this.dataFile, 'a');
        fs.closeSync(fd);
        fd = fs.openSync(this.indexFile, 'a');
        fs.closeSync(fd);

        this._rebuildIndex(false);
        var self = this;
        this.syncId = setInterval(function () {
            //console.log('sync...');
            self._syncFull();
        }, this.syncInterval * 1000);
        this.closed = false;
    };

    Yotta.prototype.close = function (vacuum) {
        clearInterval(this.syncId);
        if (vacuum) {
            this.vacuum();
        } else {
            this._syncFull();
            this._rebuildIndex(true);
        }
        fs.unlink(this.lockFile, function (err) {
            // don't care.
        });
        this.dataBuffer = null;
        this.indexBuffer = null;
        this.keySyncBuffer = null;
        this.closed = true;
    };

    Yotta.prototype._put = function (key, value) {
        if (!key || !value) {
            return new Error('Invalid key or value:' + key + ', ' + value);
        }
        var self = this;
        self.dataBuffer[key] = value;
        self.keySyncBuffer.push(key);
        if (self.keySyncBuffer.length >= self.syncBufferSize) {
            try {
                self._syncFull();
            } catch (err) {
                return err;
            }
        }
    };

    Yotta.prototype.put = function (key, value, cb) {
        var self = this;
        if (typeof cb === 'function') {
            // async
            setImmediate(function () {
                cb(self._put(key, value));
            });
        } else {
            // sync
            return self._put(key, value);
        }
    };

    Yotta.prototype._get = function (key) {
        var self = this;
        var value = self.dataBuffer[key];
        if (value === undefined) {
            var index = self.indexBuffer[key];
            if (index && index.start >= 0 && index.length >= 0) {
                try {
                    var length = index.length;
                    var buffer = new Buffer(length);
                    var fd = fs.openSync(this.dataFile, 'r');
                    fs.readSync(fd, buffer, 0, length, index.start);
                    fs.closeSync(fd);
                    value = buffer.toString();
                    self.dataBuffer[key] = value;
                } catch (err) {
                    return err;
                }
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
                if (ret instanceof Error) {
                    cb(ret);
                } else {
                    cb(null, ret);
                }
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
        try {
            var i = self.keySyncBuffer.indexOf(key);
            if (i > -1) {
                self.keySyncBuffer.splice(i, 1);
            }
            fs.appendFileSync(self.indexFile, key + ',-1,-1\n');
        } catch (err) {
            return err;
        }
    };

    Yotta.prototype.remove = function (key, cb) {
        var self = this;
        if (typeof cb === 'function') {
            // async
            setImmediate(function () {
                cb(self._remove(key));
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
                try {
                    var retIndex = Object.keys(self.indexBuffer).filter(test);
                    var retData = Object.keys(self.dataBuffer).filter(test);
                    cb(null, _.unique(retIndex.concat(retData)));
                } catch (err) {
                    cb(err);
                }
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
                    if (err) {
                        cb(err);
                        return;
                    }
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
                try {
                    self._vacuum();
                    cb(null);
                } catch (err) {
                    cb(err);
                }
            });
        } else {
            // sync
            try {
                self._vacuum();
            } catch (err) {
                return err;
            }
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
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        this.keySyncBuffer = [];
    };

    Yotta.prototype._rebuildIndex = function (writeBack) {
        var indexString = fs.readFileSync(this.indexFile, 'utf8');
        this.indexBuffer = {};
        var tmpIndexBufferString = '';
        indexString.split('\n').map(function (val) {
            if (val && val.trim()) {
                var tokens = val.split(',');
                var tokenLength = tokens.length;
                var key = tokens.slice(0, tokenLength - 2).join(',');
                var start = tokens[tokenLength - 2] >> 0;
                var length = tokens[tokenLength - 1] >> 0;
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
        if (writeBack) {
            for (var key in this.indexBuffer) {
                var index = this.indexBuffer[key];
                tmpIndexBufferString += key + ',' + index.start + ',' + index.length + '\n';
            }
            fs.writeFileSync(this.indexFile, tmpIndexBufferString);
        }
    };

    Yotta.prototype.stats = function () {
        // returns [holeSize, dataSize, holeRate]
        this._syncFull();
        var dataFileSize = fs.statSync(this.dataFile).size;
        var dataSize = 0;
        for (var key in this.indexBuffer) {
            var index = this.indexBuffer[key];
            dataSize += index.length;
        }
        var holeSize = dataFileSize - dataSize;
        return {
            holdSize: holeSize,
            dataFileSize: dataFileSize,
            holdRatio: holeSize / dataFileSize
        };
    };

    // test(value)
    Yotta.prototype.rebuildValueIndex = function (indexPath, test) {
        var vIndex = {};
        var allData = this.find(function () {
            return true;
        });
        for (var key in allData) {
            var value = allData[key];
            var indexValue = test(value);
            vIndex[indexValue] = vIndex[indexValue] || [];
            vIndex[indexValue].push(key);
        }
        fs.openSync(this.dbPath + '/' + indexPath, 'w');
        fs.writeFileSync(this.dbPath + '/' + indexPath, JSON.stringify(vIndex));
    };

    Yotta.prototype.findKeysFromValue = function (indexPath, test) {
    };

    Yotta.prototype.findFromValue = function (indexPath, test) {
    };


    exports.Yotta = Yotta;
})();