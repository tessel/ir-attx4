var tessel = require('tessel');
var test = require('tinytap');
var async = require('async');

var portName1 = process.argv[2] || 'A';
var portName2 = process.argv[3] || 'B';
var infraredLib = require('../index');
var infrared1;
var infrared2;

console.log('1..2');

async.series([
  test('connecting to first module', function(t) {
    infrared1 = infraredLib.use(tessel.port[portName1], function(err, infrared) {
      t.ok(infrared, 'infrared object not returned in use statement');
      t.equal(err, undefined, 'error returned in connecting to first module.');
      t.end();
    });
  }),
],
function (err) {
  return console.log('error with tests', err);
});
// // Receive on IR 1
// infrared1.on('data', function (data) {
//   console.log('# received RX Data:', data);
//   console.log('ok');
//   process.exit(0);
// });

// // Send on IR 2
// var sendack = false;
// infrared2.on('ready', function(err) {
//   if (err) { return console.error(err); }

//   setImmediate(function sendSignal () {
//     // Make a buffer off on/off durations (each duration is 16 bits)
//     var powerBuffer = new Buffer([
//       0, 178, 255, 168, 0, 12, 255, 246, 0, 13, 255, 225, 0, 13, 255, 224,
//       0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247,
//       0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 247, 0, 13, 255, 224,
//       0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246,
//       0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 225,
//       0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247,
//       0, 13, 255, 247, 0, 13, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246,
//       0, 12, 255, 246, 0, 12, 255, 224, 0, 13, 255, 224, 0, 12, 255, 224,
//       0, 12, 255, 224, 0, 12
//     ]);

//     // Send the signal at 38 kHz
//     infrared2.sendRawSignal(38, powerBuffer, function (err) {
//       if (err) { return console.log("Unable to send signal: ", err); }
      
//       console.log('# signal sent!');
//       !sendack && console.log('ok');
//       sendack = true;
//       setImmediate(sendSignal);
//     });
//   });
// });
