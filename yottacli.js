/**
 * Created by elgs on 6/30/14.
 */

(function () {
    "use strict";

    var readline = require('readline');
    var _ = require('lodash');
    var splitargs = require('splitargs');
    var pjson = require('./package.json');
    var ycp = require('./yottacliprocessor.js');

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: function completer(line) {
            var completions = Object.keys(cliProcessors).map(function (v) {
                if (typeof cliProcessors[v] === 'function') {
                    return v + ' ';
                } else {
                    return '';
                }
            }).sort();
            var hits = completions.filter(function (c) {
                return c.indexOf(line) === 0;
            });
            return [hits.length ? hits : completions, line];
        }
    });

    var config = {
        setPrompt: function (prompt) {
            rl.setPrompt((prompt || '') + '> ');
            rl.prompt(true);
        },
        rl: rl
    };

    ycp.config = config;

    var cliProcessors = {};
    cliProcessors.exit = function () {
        rl.close();
    };

    cliProcessors.version = function () {
        console.log(pjson.version);
        config.setPrompt(cliProcessors.context);
    };
    _.extend(cliProcessors, ycp);

    cliProcessors.quit = cliProcessors.exit;

    config.setPrompt(cliProcessors.context);

    rl.on('line', function (line) {
        var args = splitargs(line);
        var fn = args.shift();
        if (typeof cliProcessors[fn] === 'function') {
            cliProcessors[fn].apply(null, args);
        } else {
            if (fn && fn.trim()) {
                console.log(fn, 'is not implemented, yet.');
            }
            config.setPrompt(ycp.context);
        }
    });

    if (process.argv.length >= 3) {
        rl.emit('line', 'open ' + process.argv[2]);
    }
})();