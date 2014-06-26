/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var Yotta = require('../yotta.js').Yotta;
    var y0 = new Yotta('/Volumes/RAMDrive/testdb');

    describe('Yotta Suite', function () {
        beforeEach(function () {
            expect(y0.closed).toBe(true);
            y0.open();
            expect(y0.closed).toBe(false);
        });
        afterEach(function () {
            y0.close();
            expect(y0.closed).toBe(true);
        });

        it('should throw error if reopen', function () {
            expect(y0.open).toThrowError();
        });

        it('should set closed to be false', function () {
            expect(y0.closed).toBe(false);
        });

        it('should save key1/value1 in the store', function () {
            y0.put('key1', 'value1');
            expect(y0.get('key1')).toBe('value1');
        });

        it('should save key2/value2 in the store asynchronously', function (done) {
            y0.put('key1a', 'value1a', function () {
                y0.get('key1a', function (err, value) {
                    expect(value).toBe('value1a');
                    done();
                });
            });
        });

        it('should save and retrieve json object correctly', function () {
            y0.put('key2', '{"host": "localhost", "port": 80}');
            expect(JSON.parse(y0.get('key2')).port).toBe(80);
        });

        it('should save and retrieve json object correctly and asynchronously', function (done) {
            y0.put('key2a', '{"host": "127.0.0.1", "port": 443}', function () {
                y0.get('key2a', function (err, value) {
                    expect(JSON.parse(value).port).toBe(443);
                    done();
                });
            });
        });

        it('should save 1k json objects correctly', function () {
            for (var i = 0; i < (1 << 10); ++i) {
                y0.put('k' + i, 'v' + i);
            }
            expect(y0.get('k100')).toBe('v100');
        });

        it('should save 1k json objects correctly asynchronously', function (done) {
            var t = function (i) {
                return function () {
                    y0.put('ka' + i, 'va' + i, function () {
                        y0.get('ka' + i, function (err, value) {
                            expect(value).toBe('va' + i);
                            if (i === (1 << 10) - 1) {
                                done();
                            }
                        });
                    });
                };
            };
            for (var i = 0; i < (1 << 10); ++i) {
                t(i)();
            }
        });

        it('should remove k100', function () {
            y0.remove('k100');
            expect(y0.get('k100')).toBe(null);
        });

        it('should remove ka100 asynchronously', function (done) {
            y0.remove('ka100', function () {
                y0.get('ka100', function (err, value) {
                    expect(value).toBe(null);
                    done();
                });
            });
        });
    });
})();