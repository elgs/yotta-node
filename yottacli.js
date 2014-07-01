/**
 * Created by elgs on 6/30/14.
 */

(function () {
    "use strict";

    var readline = require('readline');
    var _ = require('lodash');
    var pjson = require('./package.json');
    var ycp = require('./yottacliprocessor.js');

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: function completer(line) {
            var completions = Object.keys(cliProcessors).sort();
            var hits = completions.filter(function (c) {
                return c.indexOf(line) == 0
            });
            return [hits.length ? hits : completions, line]
        }
    });

    var setPrompt = function (rl, prompt) {
        if (prompt) {
            rl.setPrompt(prompt + '>');
        }
        rl.prompt(true);
    };

    var cliProcessors = _.extend(ycp);

    setPrompt(rl);

    rl.on('line', function (line) {
        var args = line.split(/\s+/g);
        var fn = args.shift();
        if (typeof cliProcessors[fn] === 'function') {
            cliProcessors[fn].apply(null, args);
        } else {
            if (fn.trim()) {
                console.log(fn, 'is not implemented, yet.');
            }
        }
        if (fn !== 'exit') {
            setPrompt(rl);
        }
    });

    cliProcessors.exit = function () {
        rl.close();
    };

    cliProcessors.version = function () {
        //console.log([].slice.call(arguments));
        console.log(pjson.version);
    };
})();