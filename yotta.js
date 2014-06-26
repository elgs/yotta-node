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
        fs.openSync(this.indexFile, 'a');
        fs.openSync(this.dataFile, 'a');
        var indexString = fs.readFileSync(this.indexFile, 'utf8');
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
            console.log('sync...');
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

    Yotta.prototype.put = function (key, value) {
        this.dataBuffer[key] = value;
        this.keySyncBuffer.push(key);
        if (this.keySyncBuffer.length >= this.syncBufferSize) {
            this._syncFull();
            this.keySyncBuffer = [];
        }

        // precise mode
//        var index = this._syncData(key, value);
//        this.indexBuffer[key] = index;
//        this._syncIndex(key, index);
    };

    Yotta.prototype.get = function (key) {
        var value = this.dataBuffer[key];
        if (value === undefined) {
            var index = this.indexBuffer[key];
            if (index && index.start >= 0 && index.end >= 0) {
                var dataReadStream = fs.createReadStream(this.dataFile, index);
                value = dataReadStream.read().toString();
                this.dataBuffer[key] = value;
            } else {
                this.dataBuffer[key] = null;
                value = null;
            }
        }
        return value;
    };

    Yotta.prototype.remove = function (key) {
        delete this.dataBuffer[key];
        delete this.indexBuffer[key];
        fs.appendFileSync(this.indexFile, key + ',-1,-1\n');
    };

    Yotta.prototype.vacuum = function () {
        //TODO:
    };

    Yotta.prototype._syncFull = function () {
        if (!this.keySyncBuffer || this.keySyncBuffer.length === 0) {
            return;
        }
        var size = fs.statSync(this.dataFile).size;
        var self = this;
        var newData = this.keySyncBuffer.reduce(function (previousValue, currentValue, i, array) {
            var valueBuffer = new Buffer(self.dataBuffer[currentValue]);
            self.indexBuffer[currentValue] = {
                start: size,
                end: size + valueBuffer.length - 1
            };
            size += valueBuffer.length;
            return previousValue + currentValue;
        }, '');
        fs.appendFileSync(this.dataFile, newData);

        var newIndex = this.keySyncBuffer.reduce(function (previousValue, currentValue, i, array) {
            var index = self.indexBuffer[currentValue];
            return previousValue + currentValue + ',' + index.start + ',' + index.end + '\n';
        }, '');
        fs.appendFileSync(this.indexFile, newIndex);
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