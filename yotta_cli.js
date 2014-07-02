/**
 * Created by elgs on 7/2/14.
 */

(function () {
    "use strict";

    var pjson = require('./package.json');
    var ycp = require('./yotta_cli_processor.js');

    var dbName = process.argv[2];
    var fn = process.argv[3];
    var fnParams = process.argv.slice(4);

    if (ycp[fn] && typeof ycp[fn] === 'function') {
        var ret = ycp[fn].call(ycp, dbName, fnParams);
        if (ret) {
            console.log(ret);
        }
    }

    if (fn === 'version') {
        console.log(pjson.version);
    }
})();