#!/usr/bin/env node

require('shelljs/global');

var port1 = process.env.IR_PORT1 || 'A';
var port2 = process.env.IR_PORT2 || 'B';
var cmd = './node_modules/.bin/tap -e "tessel run {} ' + port1 + ' ' + port2 + '" test/*.js';

// execute
cd(__dirname)
process.exit(exec(cmd).code);
