// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

var tessel = require('tessel');

// Connect the IR module to port a
var hardware = tessel.port('a');

// Import library and connect to module
var infrared = require('../index').use(hardware);

// When we're connected
infrared.on('ready', function() {
	if (!err) {
		console.log("Connected to IR!");

		// Start turning sending a signal every three seconds
		setInterval(sendSignal, 3000);
	}
	else {
		console.log("Err initializing: ", err.message	);
	}
});

// If we get data, print it out
infrared.on('data', function(data) {
	console.log("Received RX Data: ", data);
});

var sendSignal = function() {

	// Make a buffer off on/off durations (each duration is 16 bits)
	var powerBuffer = new Buffer([0, 178, 255, 168, 0, 12, 255, 246, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 224, 0, 13, 255, 224, 0, 12, 255, 224, 0, 12, 255, 224, 0, 12]);

	// Send the signal at 38 kHz
	infrared.sendRawSignal(38, powerBuffer, function(err) {
		if (err) console.log("Unable to send signal: ", err);
		else {
			console.log("Signal sent!");
		}
	});
};
