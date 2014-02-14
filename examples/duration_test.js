var tessel = require('tessel');

// Connect the IR module to port a
var modA = tessel.port('a');
var modB = tessel.port('b');

// Import library and connect to module
var infrared = require('../index');

var transferTest = function() {
  tessel.led(1).toggle();
  // Make a buffer off on/off durations (each duration is 16 bits)
  var powerBuffer = new Buffer([0, 178, 255, 168, 0, 12, 255, 246, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 224, 0, 13, 255, 224, 0, 12, 255, 224, 0, 12, 255, 224, 0, 12]);

  // Send the signal at 38 kHz
  this.sendRawSignal(38, powerBuffer, function(err) {
    if (err) console.log("Unable to send signal: ", err);
    else {
      console.log("TV Should be powered...");
    }
  });
}

function beginTest(modPort, callback) {
  infrared.use(modPort, function(err, mod) {
    if (!err) {
      setInterval(transferTest.bind(mod), 3000);
    }
    else {
      console.log("Issue connecting: ", mod);
    }
    callback(err);
  });
}


beginTest(modA, function() {
  beginTest(modB, function() {
  });
});