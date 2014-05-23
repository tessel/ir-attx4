var tessel = require('tessel');

var portname1 = process.argv[2] || 'A';
var infrared1 = require('../index').use(tessel.port[portname1]);

var portname2 = process.argv[3] || 'B';
var infrared2 = require('../index').use(tessel.port[portname2]);

console.log('1..2')

// Receive on IR 1
infrared1.on('data', function (data) {
  console.log('# received RX Data:', data);
  console.log('ok');
  process.exit(0);
});

// Send on IR 2
var sendack = false;
infrared2.on('ready', function(err) {
  if (err) { return console.error(err); }

  setImmediate(function sendSignal () {
    // Make a buffer off on/off durations (each duration is 16 bits)
    var powerBuffer = new Buffer([
      0, 178, 255, 168, 0, 12, 255, 246, 0, 13, 255, 225, 0, 13, 255, 224,
      0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247,
      0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 247, 0, 13, 255, 224,
      0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246,
      0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 225,
      0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247,
      0, 13, 255, 247, 0, 13, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246,
      0, 12, 255, 246, 0, 12, 255, 224, 0, 13, 255, 224, 0, 12, 255, 224,
      0, 12, 255, 224, 0, 12
    ]);

    // Send the signal at 38 kHz
    infrared2.sendRawSignal(38, powerBuffer, function (err) {
      if (err) { return console.log("Unable to send signal: ", err); }
      
      console.log('# signal sent!');
      !sendack && console.log('ok');
      sendack = true;
      setImmediate(sendSignal);
    });
  });
});
