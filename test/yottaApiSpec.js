/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var Yotta = require('../yotta.js').Yotta;
    var y0 = new Yotta('/Volumes/RAMDrive/test_yotta/testApiDb');

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

        it('should find keys k100 and k102', function () {
            var keysFound = y0.findKeys(function (key, index, keys) {
                return key === 'k100' || key === 'k102';
            });
            expect(keysFound.length).toBe(2);
            expect(keysFound.some(function (v) {
                return v === 'k100' || v === 'k102';
            })).toBe(true);
        });

        it('should find keys ka100 and ka102 asynchronously', function (done) {
            y0.findKeys(function (key, index, keys) {
                return key === 'ka100' || key === 'ka102';
            }, function (err, keysFound) {
                expect(keysFound.length).toBe(2);
                expect(keysFound.some(function (v) {
                    return v === 'ka100' || v === 'ka102';
                })).toBe(true);
                done();
            });
        });

        it('should find k101 and k102', function () {
            var found = y0.find(function (key, index, keys) {
                return key === 'k101' || key === 'k102';
            });
            expect(Object.keys(found).length).toBe(2);
            expect(found['k101']).toBe('v101');
            expect(found['k102']).toBe('v102');
        });

        it('should find ka101 and ka102 asynchronously', function (done) {
            y0.find(function (key, index, keys) {
                return key === 'k101' || key === 'k102';
            }, function (err, found) {
                expect(Object.keys(found).length).toBe(2);
                expect(found['k101']).toBe('v101');
                expect(found['k102']).toBe('v102');
                done();
            });
        });


        it('should remove k100', function () {
            y0.remove('k100');
            expect(y0.get('k100')).toBeUndefined();
        });

        it('should remove ka100 asynchronously', function (done) {
            y0.remove('ka100', function (err) {
                y0.get('ka100', function (err, value) {
                    expect(value).toBeUndefined();
                    done();
                });
            });
        });

        it('should should continue to work after vacuum', function () {
            y0.vacuum();
            expect(y0.get('k105')).toBe('v105');
        });

        it('should should continue to work after vacuum asynchronously', function (done) {
            y0.vacuum(function (err) {
                expect(y0.get('k105')).toBe('v105');
                done();
            });
        });
    });
})();