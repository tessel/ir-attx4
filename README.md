#Infrared
Driver for the ir-attx4 Tessel infrared module ([Attinyx4](http://www.atmel.com/Images/doc8006.pdf)).

##Installation
```sh
npm install ir-attx4
```
##Example
```js
/*********************************************
This infrared module example transmits the
power signal sequence of an Insignia brand
television every three seconds, while also
listening for (and logging) any incoming
infrared data.
*********************************************/

// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

var tessel = require('tessel');

// Import library and connect to module on port A
var infrared = require('../').use(tessel.port['A']);

// When we're connected
infrared.on('ready', function() {
	if (!err) {
		console.log("Connected to IR!");

		// Start sending a signal every three seconds
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

	// Make a buffer of on/off durations (each duration is 16 bits)
	var powerBuffer = new Buffer([0, 178, 255, 168, 0, 12, 255, 246, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 224, 0, 12, 255, 224, 0, 13, 255, 225, 0, 13, 255, 224, 0, 12, 255, 246, 0, 12, 255, 246, 0, 13, 255, 247, 0, 13, 255, 247, 0, 13, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 246, 0, 12, 255, 224, 0, 13, 255, 224, 0, 12, 255, 224, 0, 12, 255, 224, 0, 12]);

	// Send the signal at 38 kHz
	infrared.sendRawSignal(38, powerBuffer, function(err) {
		if (err) console.log("Unable to send signal: ", err);
		else {
			console.log("Signal sent!");
		}
	});
};
```

##Methods

##### * `infrared.sendRawSignal(frequency, signalDurations, callback)` The primary method for sending data. The first argument is a frequency of signal in Hz, typically 38 but can range from 36 to 40. The second argument is a buffer of unsigned 16 bit integers representing the number of microseconds the transmission should be on. The max length of the signal durations is 100 durations.

##### * `infrared.setListening(set, callback)` Determines whether the module is listening for incoming signals. Will automatically be set and unset depending on listeners for the `data` event.


## Events

##### * `infrared.on('data', callback(data))` Emitted when an infrared signal is detected.

##### * `infrared.on('error', callback(err))` Emitted when there is an error communicating with the module.

##### * `infrared.on('ready', callback())` Emitted upon first successful communication between the Tessel and the module.


## License

Released under the MIT and Apache 2.0 licenses.

