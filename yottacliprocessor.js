/**
 * Created by elgs on 7/1/14.
 */

(function () {
    "use strict";

    var p = {};
    module.exports = p;

    p.test = function () {
        console.log([].slice.call(arguments));
    };
})();