var tessel = require('tessel');
var Attiny = require('attiny-common');

var attiny = new Attiny(tessel.port['A']);

var firmwareOptions = {
  firmwareFile : 'firmware/src/infrared-attx4.hex',
  firmwareVersion : 3,
  moduleID : 0x08,
  signature : 0x930C,
  crc : 13777,
}

// Initialize an IR module and flash it (only the IR module can calculate its CRC?)
attiny.updateFirmware(firmwareOptions, function(err) {
  if (err) {
    throw err
  }
  else {
    console.log('done updating...');
  }
});