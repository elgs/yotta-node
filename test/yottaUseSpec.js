/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var Yotta = require('../yotta.js').Yotta;
    var y1 = new Yotta('/Volumes/RAMDrive/testUseDb');

    describe('Yotta Suite', function () {
        beforeEach(function () {
            expect(y1.closed).toBe(true);
            y1.open();
            expect(y1.closed).toBe(false);
        });
        afterEach(function () {
            y1.close();
            expect(y1.closed).toBe(true);
        });

        it('should work', function () {
            y1.put('name', 'Elgs Chen');
            y1.put('email', 'elgs1980@hotmail.com');
            y1.put('work', 'programmer');

            expect(y1.get('name')).toBe('Elgs Chen');
            expect(y1.get('email')).toBe('elgs1980@hotmail.com');
            expect(y1.get('work')).toBe('programmer');

            var allKeys = y1.findKeys(function (key) {
                return true;
            });
            expect(allKeys.length).toBe(3);
            expect(allKeys.indexOf('name')).toBeGreaterThan(-1);
            expect(allKeys.indexOf('email')).toBeGreaterThan(-1);
            expect(allKeys.indexOf('work')).toBeGreaterThan(-1);

            expect(y1.get('name')).toBe('Elgs Chen');
            expect(y1.get('email')).toBe('elgs1980@hotmail.com');
            expect(y1.get('work')).toBe('programmer');

            var all = y1.find(function (key) {
                return true;
            });
            expect(Object.keys(all).length).toBe(3);
            expect(all.name).toBe('Elgs Chen');
            expect(all.email).toBe('elgs1980@hotmail.com');
            expect(all.work).toBe('programmer');

            expect(y1.get('name')).toBe('Elgs Chen');
            expect(y1.get('email')).toBe('elgs1980@hotmail.com');
            expect(y1.get('work')).toBe('programmer');

            y1.remove('work');

            expect(y1.get('name')).toBe('Elgs Chen');
            expect(y1.get('email')).toBe('elgs1980@hotmail.com');
            expect(y1.get('work')).toBeUndefined();

            allKeys = y1.findKeys(function (key) {
                return true;
            });
            expect(allKeys.length).toBe(2);
            expect(allKeys.indexOf('name')).toBeGreaterThan(-1);
            expect(allKeys.indexOf('email')).toBeGreaterThan(-1);
            expect(allKeys.indexOf('work')).toBe(-1);

            expect(y1.get('name')).toBe('Elgs Chen');
            expect(y1.get('email')).toBe('elgs1980@hotmail.com');
            expect(y1.get('work')).toBeUndefined()

            all = y1.find(function (key) {
                return true;
            });
            expect(Object.keys(all).length).toBe(2);
            expect(all.name).toBe('Elgs Chen');
            expect(all.email).toBe('elgs1980@hotmail.com');
            expect(all.work).toBeUndefined();

            expect(y1.get('name')).toBe('Elgs Chen');
            expect(y1.get('email')).toBe('elgs1980@hotmail.com');
            expect(y1.get('work')).toBeUndefined();

        });
    });
})();