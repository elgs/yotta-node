/**
 * Created by elgs on 6/30/14.
 */

(function () {
    "use strict";

    var readline = require('readline');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: function completer(line) {
            var completions = '/nick /msg /me'.split(' ');
            var hits = completions.filter(function (c) {
                return c.indexOf(line) == 0
            });
            return [hits.length ? hits : completions, line]
        }
    });

    setPrompt(rl);

    rl.on('line', function (line) {
        if (line === 'exit') {
            rl.close();
        } else {
            setPrompt(rl);
        }
    });

    function setPrompt(rl, prompt) {
        if (prompt) {
            rl.setPrompt(prompt + '>');
        }
        rl.prompt(true);
    }
})();