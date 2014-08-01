var tessel = require('tessel');
var Attiny = require('attiny-common');

var attiny = new Attiny(tessel.port['A']);

var firmwareOptions = {
  firmwareFile : __dirname + '/../firmware/src/infrared-attx4.hex',
  firmwareVersion : 3,
  moduleID : 0x0B,
  signature : 0x930C,
  crc : 13777,
}

// Force an update
attiny.updateFirmware(firmwareOptions, function(err) {
  if (err) {
    throw err
  }
  else {
    console.log('done updating...');
  }
});