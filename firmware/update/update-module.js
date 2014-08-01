var tessel = require('tessel');
var Attiny = require('attiny-common');
var port =  process.argv[2];
var version = process.argv[3];

if (!version) {
  console.log("Usage: tessel run update-module.js <IR-PORT> <NEW_FIRMWARE_VERSION_NUM>");
  return;
}

var attiny = new Attiny(tessel.port[port]);

var firmwareOptions = {
  firmwareFile : 'firmware/src/infrared-attx4.hex',
  firmwareVersion : version,
  moduleID : 0x0B,
  signature : 0x930C,
  crc : undefined,
}

// Initialize an IR module and flash it (only the IR module can calculate its CRC?)
attiny.initialize(firmwareOptions, function(err) {
  console.log('done initializing...');
  if (err) {
    throw err
  }

  attiny.getCRC(function(err, crc) {
    if (err) {
      throw err;
    }
    console.log("Copy the following into index.js:")
    console.log('\n// Firmware release info. Updated with each release\nvar FIRMWARE_VERSION = ' + version + ';\nvar CRC = ' + crc + ';\n')
  });
});