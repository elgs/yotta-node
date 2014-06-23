/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var Yotta = function (dbPath, config) {
        config = config || {
            read: true,
            write: true
        };
        this.dbPath = dbPath;
        this.read = config.read || true;
        this.write = config.write || true;
        this.closed = true;
    };

    Yotta.prototype.open = function () {
        this.closed = false;
    };

    Yotta.prototype.close = function () {
        this.closed = true;
    };

    Yotta.prototype.put = function (key, value) {
    };

    Yotta.prototype.get = function (key) {
    };

    module.exports = Yotta;
})();