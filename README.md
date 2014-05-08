#Infrared
Driver for the ir-attx4 Tessel infrared module ([Attinyx4](http://www.atmel.com/Images/doc8006.pdf)).

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
var infrared = require('ir-attx4').use(hardware);

// When we're connected
infrared.on('ready', function(err) {
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

The primary method for sending data. The first argument is a frequency of signal in Hz, typically 38 but can range from 36 to 40. The second argument is a buffer
of unsinged 16 bit integers representing the number of microseconds the transmission should be on. The max length of the signal durations is 100 durations.
*  **`infrared`.sendRawSignal(frequency, signalDurations, callback)**

Determines whether the module is listening for incoming signals
Will automatically be set and unset depending on listeners for the
`data` event.
*  **`infrared`.setListening(set, callback)**

## Events

Called when the module is detected and ready to receive commands
*  **`infrared`.on(`ready`, callback)**

Called when an IR signal is detected
* **`infrared`.on(`data`, callback(data))**

Called when there is an error connecting to the module
* **`infrared`.on(`error`, callback(err))**

## License

MIT/Apache 2.0

