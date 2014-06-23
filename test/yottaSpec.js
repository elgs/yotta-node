/**
 * Created by elgs on 6/23/14.
 */

(function () {
    "use strict";

    var Yotta = require('../yotta.js').Yotta;

    describe('Yotta Suite', function () {
        it('should return false before open', function () {
            var y0 = new Yotta('./testdb');
            expect(y0.closed).toBe(true);
            y0.open();
            expect(y0.open).toThrowError();
            expect(y0.closed).toBe(false);
            y0.close();
            expect(y0.closed).toBe(true);
        });
    });
})();