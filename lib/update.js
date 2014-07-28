var tessel = require('tessel');
var firmware = require('./firmware');
var FIRMWARE_FILE = 'firmware/src/infrared-attx4.hex';

console.warn('updating firmware');
firmware.update( tessel.port['A'], FIRMWARE_FILE, function(){
  console.warn('finished');
});
