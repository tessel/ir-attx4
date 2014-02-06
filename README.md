#Infrared
Driver for the ir-attx4 Tessel infrared module ([ATTX4]()).

##Really Important Information
e.g. "this isn't ready to go yet" or "here is some special way you have to use this or it won't work"
Hopefully we don't need this section by the time we release things to the public

##Installation
```sh
npm install ir-attx4
```
##Example
```js
var tessel = require('tessel');

// Connect the IR module to port a
var hardware = tessel.port("A");

// Import library and connect to module
var infrared = require('ir-attx4').connect(hardware);

var counter = 0;

// When we're connected
infrared.on('connected', function(err) {
	if (!err) {
		console.log("Connected to IR!");

		// Start turning tv on and off every 3 seconds
		setInterval(powerTV, 3000);
	}
	else {
		console.log("Err initializing: ", err.message	);
	}
});

// If we get data, print it out
infrared.on('data', function(data) {
	console.log("Received RX Data: ", data);
});

var powerTV = function() {

	// Make a buffer off on/off durations (each duration is 16 bits)
	var powerBuffer = new Buffer([0, 178, 255, 168, 0, 12, 255, 246, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 224, 0, 13, 255, 224, 0, 12, 255, 224, 0, 12, 255, 224, 0, 12]);

	// Send the signal at 38 kHz
	infrared.sendRawSignal(38, powerBuffer, function(err) {
		if (err) console.log("Unable to send signal: ", err);
		else {
			console.log("TV Should be powered...");
		}
	});
}
```

##Methods

*  **`infrared`.setListening(set, callback)**

*  **`infrared`.sendRawSignal(frequency, signalDurations, callback)**

## License

MIT
